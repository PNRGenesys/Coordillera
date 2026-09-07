import { styled } from '@linaria/react'

const Photo = styled.img`
  border-radius: 50%;
  height: 72px;
  object-fit: cover;
  width: 72px;
`
const Initial = styled.span`
  align-items: center;
  background: var(--color-surface);
  border-radius: 50%;
  color: var(--color-accent);
  display: flex;
  font-size: 1.4rem;
  font-weight: 800;
  height: 72px;
  justify-content: center;
  width: 72px;
`

export type AccountAvatarProps = {
  avatar: string | null
  name: string
}

/** The picture of the account, or the first letter of the name while there is none. */
export function AccountAvatar({ avatar, name }: AccountAvatarProps) {
  if (avatar) return <Photo src={avatar} alt={name} />
  return <Initial aria-hidden="true">{name.slice(0, 1).toUpperCase()}</Initial>
}
