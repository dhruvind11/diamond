export interface CompanyProfileI {
  _id: string;
  companyName: string;
  email: string;
  address: string;
  phone: number;
  logoImage: string;
  note: string;
}

export interface UpdateCompanyProfile {
  companyName?: string;
  logoImage?: string;
  note?: string;
}
