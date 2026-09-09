import { styled } from '@linaria/react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from '../lib/use-translation'
import type { TranslationKey } from '../lib/translations'
import { useUpdateCustomerRoleMutation, type AdminCustomer, type CustomerRole } from '../store/catalog-api'
import { Field, PrimaryButton, Select } from './primitives'
import { StateMessage } from './StateMessage'

const roleKeys: Record<CustomerRole, TranslationKey> = {
  customer: 'admin.roleCustomer',
  admin: 'admin.roleAdmin',
  artist: 'admin.roleArtist',
}

const Row = styled.form`
  align-items: end;
  border: 1px solid var(--color-border);
  display: grid;
  gap: 0.75rem;
  grid-template-columns: minmax(0, 1fr) minmax(0, 12rem) auto;
  padding: 1rem 1.25rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`
const Name = styled.p`
  font-size: 0.85rem;
  margin: 0;
`
const Email = styled.p`
  color: var(--color-accent);
  font-size: 0.75rem;
  margin: 0.15rem 0 0;
`

export type AdminCustomerCardProps = {
  customer: AdminCustomer
}

export function AdminCustomerCard({ customer }: AdminCustomerCardProps) {
  const { t } = useTranslation()
  const [updateRole, updateRoleState] = useUpdateCustomerRoleMutation()
  const [role, setRole] = useState<CustomerRole>(customer.role)

  function saveRole(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    void updateRole({ id: customer.id, role })
  }

  const name = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || customer.email

  return (
    <Row onSubmit={saveRole}>
      <div>
        <Name>{name}</Name>
        <Email>{customer.email}</Email>
      </div>
      <Field>
        {t('admin.role')}
        <Select value={role} onChange={(event) => setRole(event.target.value as CustomerRole)}>
          {Object.entries(roleKeys).map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}
        </Select>
      </Field>
      <div>
        <PrimaryButton type="submit" disabled={updateRoleState.isLoading}>
          {updateRoleState.isSuccess ? t('admin.saved') : t('admin.save')}
        </PrimaryButton>
        {updateRoleState.isError && <StateMessage kind="error">{t('admin.updateError')}</StateMessage>}
      </div>
    </Row>
  )
}
