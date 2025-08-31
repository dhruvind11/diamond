import AxiosRequest from "../../AxiosRequest";

const transformLedgerData = (data: any) => {
  let runningBalance = 0;

  return data.map((entry: any) => {
    // decide party name
    const party = entry.type.includes("debit")
      ? entry.toUser?.username
      : entry.fromUser?.username;

    // update running balance
    if (entry.type.includes("debit")) {
      runningBalance -= entry.amount;
    } else {
      runningBalance += entry.amount;
    }

    return {
      id: entry._id,
      date: new Date(entry.createdAt).toISOString().split("T")[0],
      party,
      description: entry.description,
      debit: entry.type.includes("debit") ? entry.amount : 0,
      credit: entry.type.includes("credit") ? entry.amount : 0,
      balance: runningBalance,
      status: entry.status || "pending", // if you have status in schema
    };
  });
};

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
