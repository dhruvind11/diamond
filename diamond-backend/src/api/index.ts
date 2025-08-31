import AuthController from './auth/auth.controller';
import CompanyProfileController from './companyProfile/companyProfile.controller';
import InvoiceController from './Invoice/invoice.controller';
import LedgerController from './ledger/ledger.controller';
import UserController from './users/users.controller';

export = [
  new CompanyProfileController(),
  new UserController(),
  new AuthController(),
  new InvoiceController(),
  new LedgerController(),
];
