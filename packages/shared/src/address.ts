export interface AddressData {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}

export interface CreateAddressInput {
  fullName: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  isDefault?: boolean;
}

export interface UpdateAddressInput extends Partial<CreateAddressInput> {}
