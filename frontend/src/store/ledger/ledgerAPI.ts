import AxiosRequest from "../../AxiosRequest";



export const fetchCompanyLedgerAPI = async (companyId: string) => {
  const { data } = await AxiosRequest.get(`/ledger/${companyId}`);
  console.log("response", data);
  return data?.data;
};

export const fetchPartyLedgerAPI = async (
  companyId: string,
  partyId: string
) => {
  const { data } = await AxiosRequest.get(
    `/ledger/${companyId}/party/${partyId}`
  );
  return data?.data;
};
