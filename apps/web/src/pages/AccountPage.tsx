import { styled } from '@linaria/react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { AccountAvatar } from '../components/AccountAvatar'
import {
  Field,
  FieldRow,
  FormGrid,
  Input,
  Legend,
  Note,
  PrimaryButton,
  PrimaryLink,
  Section,
  SectionHeader,
  SectionTitle,
  TextButton,
} from '../components/primitives'
import { StateMessage } from '../components/StateMessage'
import { accountErrorKey, accountFullName, formatAddress, PASSWORD_MIN_LENGTH } from '../lib/account'
import { useAccount } from '../lib/use-account'
import { useTranslation } from '../lib/use-translation'
import { useLoginMutation, useLogoutMutation, useRegisterMutation, type RegisterInput } from '../store/catalog-api'

type Mode = 'signIn' | 'register'

const emptyForm: RegisterInput = { email: '', password: '', firstName: '', lastName: '', phone: '' }

const Hint = styled.span`
  color: var(--color-accent);
  font-size: 0.7rem;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
`
const SwitchButton = styled(TextButton)`
  font-size: 0.75rem;
  letter-spacing: 0.08em;
`
const Summary = styled.div`
  display: grid;
  gap: 0.75rem;
  max-width: 460px;
`
const Identity = styled.div`
  align-items: center;
  display: flex;
  gap: 1rem;
`
const Name = styled.p`
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0;
`
const Detail = styled.p`
  font-size: 0.85rem;
  margin: 0;
`
const Actions = styled.div`
  display: grid;
  gap: 1rem;
  justify-items: start;
  margin-top: 1rem;
`

export function AccountPage() {
  const { t } = useTranslation()
  const { account, isLoading } = useAccount()
  const [signIn, signInState] = useLoginMutation()
  const [createAccount, registerState] = useRegisterMutation()
  const [signOut, signOutState] = useLogoutMutation()
  const [mode, setMode] = useState<Mode>('signIn')
  const [form, setForm] = useState<RegisterInput>(emptyForm)

  function updateField(field: keyof RegisterInput) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target
      setForm((current) => ({ ...current, [field]: value }))
    }
  }

  function switchMode(): void {
    setMode((current) => (current === 'signIn' ? 'register' : 'signIn'))
  }

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    if (mode === 'signIn') {
      void signIn({ email: form.email, password: form.password })
      return
    }
    void createAccount({ ...form, phone: form.phone ? form.phone : undefined })
  }

  if (isLoading) return <Section><StateMessage kind="loading">{t('account.loading')}</StateMessage></Section>

  // Signed in, the account opens on its data; editing lives behind the button below.
  if (account) {
    return (
      <Section>
        <SectionHeader>
          <SectionTitle>{t('account.title')}</SectionTitle>
        </SectionHeader>
        <Summary>
          <Identity>
            <AccountAvatar avatar={account.avatar} name={accountFullName(account)} />
            <div>
              <Name>{accountFullName(account)}</Name>
              <Detail>{account.email}</Detail>
            </div>
          </Identity>
          <Detail>{account.phone ? t('account.phoneLabel', { phone: account.phone }) : t('account.phoneMissing')}</Detail>

          <Legend>{t('account.shippingTitle')}</Legend>
          <Detail>{account.shippingAddress ? formatAddress(account.shippingAddress) : t('account.addressMissing')}</Detail>
          <Note>{t('account.checkoutNotice')}</Note>

          <Actions>
            <PrimaryLink to="/account/edit">{t('account.editProfile')}</PrimaryLink>
            <TextButton type="button" disabled={signOutState.isLoading} onClick={() => void signOut()}>
              {t('account.signOut')}
            </TextButton>
          </Actions>
        </Summary>
      </Section>
    )
  }

  const isRegister = mode === 'register'
  const activeState = isRegister ? registerState : signInState

  return (
    <Section>
      <SectionHeader>
        <SectionTitle>{isRegister ? t('account.registerTitle') : t('account.signInTitle')}</SectionTitle>
      </SectionHeader>
      {activeState.isError && <StateMessage kind="error">{t(accountErrorKey(activeState.error))}</StateMessage>}
      <FormGrid onSubmit={submit}>
        <Field>
          {t('account.email')}
          <Input type="email" required autoComplete="email" value={form.email} onChange={updateField('email')} />
        </Field>
        <Field>
          {t('account.password')}
          <Input
            type="password"
            required
            minLength={isRegister ? PASSWORD_MIN_LENGTH : undefined}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            value={form.password}
            onChange={updateField('password')}
          />
          {isRegister && <Hint>{t('account.passwordHint', { min: PASSWORD_MIN_LENGTH })}</Hint>}
        </Field>
        {isRegister && (
          <>
            <FieldRow>
              <Field>
                {t('account.firstName')}
                <Input required autoComplete="given-name" value={form.firstName} onChange={updateField('firstName')} />
              </Field>
              <Field>
                {t('account.lastName')}
                <Input required autoComplete="family-name" value={form.lastName} onChange={updateField('lastName')} />
              </Field>
            </FieldRow>
            <Field>
              {t('account.phone')}
              <Input autoComplete="tel" value={form.phone ?? ''} onChange={updateField('phone')} />
            </Field>
          </>
        )}
        <PrimaryButton type="submit" disabled={activeState.isLoading}>
          {isRegister ? t('account.registerAction') : t('account.signInAction')}
        </PrimaryButton>
        <SwitchButton type="button" onClick={switchMode}>
          {isRegister ? t('account.switchToSignIn') : t('account.switchToRegister')}
        </SwitchButton>
      </FormGrid>
    </Section>
  )
}
