"""Transparent reverse proxy for the API.

The middleware sits on the critical path: the frontend calls `/api/*` and this
module forwards each request to the internal Fastify API, then returns its
response unchanged. Keeping it transparent means the frontend keeps using the
relative `/api/` path and the httpOnly session cookie keeps working, while the
API stops being reachable directly from the browser. Edge concerns (rate
limiting, edge auth) will hang off this single entry point later.
"""

import httpx
from fastapi import Request, Response

# Hop-by-hop headers must not be forwarded; they describe a single transport hop,
# not the end-to-end message (RFC 7230). httpx sets Host/Content-Length itself.
HOP_BY_HOP_HEADERS = frozenset(
    {
        "connection",
        "keep-alive",
        "proxy-authenticate",
        "proxy-authorization",
        "te",
        "trailers",
        "transfer-encoding",
        "upgrade",
        "host",
        "content-length",
    }
)


def _forwardable_request_headers(request: Request) -> dict[str, str]:
    """Copy client headers except hop-by-hop ones. Cookie is kept so the API
    still sees the session cookie."""

    return {
        key: value
        for key, value in request.headers.items()
        if key.lower() not in HOP_BY_HOP_HEADERS
    }


async def proxy_to_api(request: Request) -> Response:
    """Forward the incoming request to the Fastify API and relay its response.

    Preserves method, path, query string, headers, cookies and body in both
    directions. Set-Cookie headers are relayed individually so the browser
    receives the session cookie exactly as the API issued it.
    """

    client: httpx.AsyncClient = request.app.state.api_client

    # Same path and query as received; the client's base_url points at the API.
    # Fastify routes are all prefixed with /api, and request.url.path keeps that
    # prefix, so the target resolves to e.g. http://api:3000/api/products.
    target = request.url.path
    if request.url.query:
        target = f"{target}?{request.url.query}"

    body = await request.body()

    try:
        upstream = await client.request(
            method=request.method,
            url=target,
            headers=_forwardable_request_headers(request),
            content=body,
        )
    except httpx.RequestError:
        # The API is unreachable or timed out: report a bad gateway rather than
        # leaking an internal error.
        return Response(content=b'{"code":"bad_gateway","message":"Upstream API unavailable"}', status_code=502, media_type="application/json")

    # Relay response headers, dropping ones the ASGI server recomputes. Set-Cookie
    # is added separately (there can be several and they must stay distinct).
    excluded = {"content-length", "content-encoding", "transfer-encoding", "connection", "set-cookie"}
    response = Response(content=upstream.content, status_code=upstream.status_code)
    for key, value in upstream.headers.items():
        if key.lower() not in excluded:
            response.headers[key] = value
    for cookie in upstream.headers.get_list("set-cookie"):
        response.headers.append("set-cookie", cookie)

    return response
