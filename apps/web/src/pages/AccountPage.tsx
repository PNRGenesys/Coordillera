import { styled } from '@linaria/react'
import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Field, FieldRow, Input, PrimaryButton, Section, SectionHeader, SectionTitle } from '../components/primitives'
import { StateMessage } from '../components/StateMessage'
import { accountDisplayName, accountErrorKey, PASSWORD_MIN_LENGTH } from '../lib/account'
import { useAccount } from '../lib/use-account'
import { useTranslation } from '../lib/use-translation'
import { useLoginMutation, useLogoutMutation, useRegisterMutation, type RegisterInput } from '../store/catalog-api'

type Mode = 'signIn' | 'register'

const Form = styled.form`
  display: grid;
  gap: 1rem;
  max-width: 420px;
`
const Hint = styled.span`
  color: var(--color-accent);
  font-size: 0.7rem;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
`
const SwitchButton = styled.button`
  background: transparent;
  border: none;
  color: var(--color-accent);
  cursor: pointer;
  font-size: 0.75rem;
  font-weight: 800;
  justify-self: start;
  letter-spacing: 0.08em;
  padding: 0;
  text-decoration: underline;
  text-transform: uppercase;
`
const Profile = styled.div`
  border: 1px solid var(--color-border);
  display: grid;
  gap: 0.75rem;
  max-width: 420px;
  padding: 2rem;
`
const ProfileLine = styled.p`
  margin: 0;
`

const emptyForm: RegisterInput = { email: '', password: '', firstName: '', lastName: '', phone: '' }

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

  if (account) {
    return (
      <Section>
        <SectionHeader>
          <SectionTitle>{t('account.title')}</SectionTitle>
        </SectionHeader>
        <Profile>
          <ProfileLine>{t('account.greeting', { name: accountDisplayName(account) })}</ProfileLine>
          <ProfileLine>{t('account.emailLabel', { email: account.email })}</ProfileLine>
          <ProfileLine>{account.phone ? t('account.phoneLabel', { phone: account.phone }) : t('account.phoneMissing')}</ProfileLine>
          <ProfileLine>{t('account.checkoutNotice')}</ProfileLine>
          <PrimaryButton type="button" disabled={signOutState.isLoading} onClick={() => void signOut()}>
            {t('account.signOut')}
          </PrimaryButton>
        </Profile>
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
      <Form onSubmit={submit}>
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
      </Form>
    </Section>
  )
}
