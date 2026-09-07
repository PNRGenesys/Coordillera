import { styled } from '@linaria/react'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AccountAvatar } from '../components/AccountAvatar'
import {
  Field,
  FieldRow,
  FormGrid,
  Input,
  Legend,
  Note,
  PrimaryButton,
  Section,
  SectionHeader,
  SectionTitle,
  TextButton,
  TextLink,
} from '../components/primitives'
import { StateMessage } from '../components/StateMessage'
import { accountErrorKey, accountFullName } from '../lib/account'
import { toAvatarDataUrl } from '../lib/avatar'
import { useAccount } from '../lib/use-account'
import { useTranslation } from '../lib/use-translation'
import { useUpdateProfileMutation, type AccountProfile, type ShippingAddress } from '../store/catalog-api'

type ProfileForm = {
  email: string
  firstName: string
  lastName: string
  phone: string
  address: ShippingAddress
}

const emptyAddress: ShippingAddress = { line1: '', line2: '', city: '', region: '', postalCode: '', country: 'CO' }

function toProfileForm(account: AccountProfile): ProfileForm {
  return {
    email: account.email,
    firstName: account.firstName ?? '',
    lastName: account.lastName ?? '',
    phone: account.phone ?? '',
    address: { ...emptyAddress, ...account.shippingAddress },
  }
}

/** An address is only sent when it has something in it; half filled would be rejected by the API. */
function addressToSend(address: ShippingAddress): ShippingAddress | null {
  const filled = [address.line1, address.city, address.region, address.postalCode, address.country].some((value) => value.trim())
  return filled ? address : null
}

const PhotoRow = styled.div`
  align-items: center;
  display: flex;
  gap: 1rem;
`
const PhotoActions = styled.div`
  display: grid;
  gap: 0.4rem;
  justify-items: start;
`

export function AccountEditPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { account, isLoading } = useAccount()
  const [updateProfile, updateProfileState] = useUpdateProfileMutation()
  const [profile, setProfile] = useState<ProfileForm | undefined>(undefined)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [photoFailed, setPhotoFailed] = useState(false)

  // The form starts from the stored profile and follows it if it changes elsewhere.
  useEffect(() => {
    if (!account) return
    setProfile(toProfileForm(account))
    setAvatar(account.avatar)
  }, [account])

  // Saving takes the customer back to their data, which is where the changes are read.
  useEffect(() => {
    if (updateProfileState.isSuccess) void navigate('/account')
  }, [updateProfileState.isSuccess, navigate])

  function updateProfileField(field: keyof Omit<ProfileForm, 'address'>) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setProfile((current) => (current ? { ...current, [field]: value } : current))
    }
  }

  function updateAddressField(field: keyof ShippingAddress) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setProfile((current) => (current ? { ...current, address: { ...current.address, [field]: value } } : current))
    }
  }

  function pickPhoto(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0]
    if (!file) return
    setPhotoFailed(false)
    void toAvatarDataUrl(file).then(setAvatar).catch(() => setPhotoFailed(true))
  }

  function save(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (!profile) return
    void updateProfile({
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      phone: profile.phone,
      avatar,
      shippingAddress: addressToSend(profile.address),
    })
  }

  if (isLoading) return <Section><StateMessage kind="loading">{t('account.loading')}</StateMessage></Section>
  if (!account || !profile) {
    return (
      <Section>
        <StateMessage kind="error">{t('account.signInFirst')}</StateMessage>
      </Section>
    )
  }

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{t('account.editTitle')}</SectionTitle>
      </SectionHeader>
      <FormGrid onSubmit={save}>
        <PhotoRow>
          <AccountAvatar avatar={avatar} name={accountFullName(account)} />
          <PhotoActions>
            <Field>
              {t('account.photo')}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickPhoto} />
            </Field>
            {avatar && <TextButton type="button" onClick={() => setAvatar(null)}>{t('account.removePhoto')}</TextButton>}
          </PhotoActions>
        </PhotoRow>
        {photoFailed && <StateMessage kind="error">{t('account.photoError')}</StateMessage>}

        <FieldRow>
          <Field>
            {t('account.firstName')}
            <Input required autoComplete="given-name" value={profile.firstName} onChange={updateProfileField('firstName')} />
          </Field>
          <Field>
            {t('account.lastName')}
            <Input required autoComplete="family-name" value={profile.lastName} onChange={updateProfileField('lastName')} />
          </Field>
        </FieldRow>
        <Field>
          {t('account.email')}
          <Input type="email" required autoComplete="email" value={profile.email} onChange={updateProfileField('email')} />
        </Field>
        <Field>
          {t('account.phone')}
          <Input autoComplete="tel" value={profile.phone} onChange={updateProfileField('phone')} />
        </Field>

        <Legend>{t('account.shippingTitle')}</Legend>
        <Note>{t('account.shippingNotice')}</Note>
        <Field>
          {t('checkout.line1')}
          <Input autoComplete="address-line1" value={profile.address.line1} onChange={updateAddressField('line1')} />
        </Field>
        <Field>
          {t('checkout.line2')}
          <Input autoComplete="address-line2" value={profile.address.line2 ?? ''} onChange={updateAddressField('line2')} />
        </Field>
        <FieldRow>
          <Field>
            {t('checkout.city')}
            <Input autoComplete="address-level2" value={profile.address.city} onChange={updateAddressField('city')} />
          </Field>
          <Field>
            {t('checkout.region')}
            <Input autoComplete="address-level1" value={profile.address.region} onChange={updateAddressField('region')} />
          </Field>
        </FieldRow>
        <FieldRow>
          <Field>
            {t('checkout.postalCode')}
            <Input autoComplete="postal-code" value={profile.address.postalCode} onChange={updateAddressField('postalCode')} />
          </Field>
          <Field>
            {t('checkout.country')}
            <Input maxLength={2} autoComplete="country" value={profile.address.country} onChange={updateAddressField('country')} />
          </Field>
        </FieldRow>

        <PrimaryButton type="submit" disabled={updateProfileState.isLoading}>
          {t('account.save')}
        </PrimaryButton>
        {updateProfileState.isError && <StateMessage kind="error">{t(accountErrorKey(updateProfileState.error))}</StateMessage>}
        <TextLink to="/account">{t('account.backToAccount')}</TextLink>
      </FormGrid>
    </Section>
  )
}
