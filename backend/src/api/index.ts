import AuthController from './auth/auth.controller';
import CompanyProfileController from './companyProfile/companyProfile.controller';
import DiwaliCycleController from './diwaliCycle/diwaliCycle.controller';
import InvoiceController from './Invoice/invoice.controller';
import LedgerController from './ledger/ledger.controller';
import ReportController from './report/report.controller';
import UserController from './users/users.controller';

export = [
  new CompanyProfileController(),
  new UserController(),
  new AuthController(),
  new InvoiceController(),
  new LedgerController(),
  new DiwaliCycleController(),
  new ReportController(),
];
