import {
  Autocomplete,
  Box,
  Button,
  Card,
  CircularProgress,
  TextField,
} from "@mui/material";

import { useAppDispatch, useAppSelector } from "../../store/store";
import logoImage from "../../../public/eco-5465482_1280.webp";
import DatePickerComponent from "../../components/DatePickerComponent";
import { useCallback, useEffect, useState } from "react";
import { getAllCompanyUser, getUserDropdown } from "../../store/user/userSlice";
import InvoiceItemsSection from "./InvoiceItemsSection";
import InvoiceSummarySection from "./InvoiceSummarySection";
import dayjs from "dayjs";
import {
  createInvoice,
  getNextInvoiceNumber,
} from "../../store/invoice/invoiceSlice";
import { useLocation, useNavigate } from "react-router-dom";
import { debounce } from "lodash";

const AddInvoice = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const { company, user, loading } = useAppSelector((state) => state.auth);
  const {
    userDropdown,
  } = useAppSelector((state) => state.user);
  const { nextInvoiceNumber } = useAppSelector((state) => state.invoice);
  const invoiceType = location.state?.invoiceType || "sell";
  const [errors, setErrors] = useState<any>({});
  const [formData, setFormData] = useState<any>({
    createdDate: dayjs(),
  });
  console.log("loading", loading);
  useEffect(() => {
    console.log("inside useEffect", dayjs());
    setFormData({
      createdDate: dayjs(),
      billNo: "",
      dueDate: null,
      seller:
        invoiceType === "sell"
          ? {
              value: user?._id,
              label: user?.username,
              email: user?.email,
              address: user?.address || "",
            }
          : null,
      buyer:
        invoiceType === "buy"
          ? {
              value: user?._id,
              label: user?.username,
              email: user?.email,
              address: user?.address || "",
            }
          : null,
      items: [{ name: "", description: "", cost: "", qty: 1, price: "" }],
      broker: null,
      note: company?.note || "",
      discount: 0,
      tax: 0,
      subTotal: 0,
    });
  }, [user, company]);

  console.log("formData", formData);
  useEffect(() => {
    dispatch(getNextInvoiceNumber({}));
  }, [user]);
  useEffect(() => {
    const subTotal = formData?.items?.reduce(
      (sum: number, item: any) => sum + parseFloat(item.price || "0"),
      0
    );

    const totalAmount = parseFloat(
      (subTotal - (formData.discount || 0))?.toFixed(2)
    );
    const brokerageAmount =
      (totalAmount * (formData?.brokeragePercentage || 0)) / 100;

    setFormData((prev: any) => ({
      ...prev,
      subTotal,
      brokerageAmount,
      totalAmount,
    }));
  }, [
    formData?.items,
    formData?.discount,
    formData?.tax,
    formData?.brokeragePercentage,
  ]);

  console.log("formData", formData);
  useEffect(() => {
    const base = formData?.createdDate ? dayjs(formData.createdDate) : dayjs();

    const hasDueDay =
      formData?.dueDay !== undefined &&
      formData?.dueDay !== "" &&
      !isNaN(Number(formData?.dueDay)) &&
      Number(formData?.dueDay) >= 0;

    if (hasDueDay) {
      const calculatedDueDate = base.add(Number(formData.dueDay), "day");
      setFormData((prev: any) => ({
        ...prev,
        dueDate: calculatedDueDate,
      }));
      setErrors((prev: any) => ({ ...prev, dueDay: "", dueDate: "" }));
    } else {
      setFormData((prev: any) => ({ ...prev, dueDate: null }));
    }
  }, [formData?.dueDay, formData?.createdDate]);

  const handleDateChange = (date: any, name: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [name]: date,
    }));
    setErrors((prev: any) => ({ ...prev, [name]: "" }));
  };

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev: any) => ({ ...prev, [name]: "" }));
  };
  const handleSelectChange = (option: any, name: string) => {
    console.log("option", option, name);
    setFormData((prev: any) => ({
      ...prev,
      [name]: option,
    }));
    setErrors((prev: any) => ({ ...prev, [name]: "" }));
  };

  const handleSummaryChange = (field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev: any) => ({ ...prev, [field]: "" }));
  };
  const handleItemChange = (idx: number, field: string, value: any) => {
    const newItems = [...formData.items];
    if (field === "cost") {
      newItems[idx][field] = parseFloat(value) || 0;
    } else if (field === "qty") {
      newItems[idx][field] = parseInt(value) || 0;
    } else {
      newItems[idx][field] = value;
    }

    if (field === "cost" || field === "qty") {
      newItems[idx].price = parseFloat(
        (newItems[idx].cost * newItems[idx].qty).toFixed(2)
      );
    }

    setFormData((prev: any) => ({
      ...prev,
      items: newItems,
    }));
    setErrors((prev: any) => ({
      ...prev,
      items: { ...prev.items, [idx]: {} },
    }));
  };

  const handleAddItem = () => {
    setFormData((prev: any) => ({
      ...prev,
      items: [
        ...prev.items,
        { name: "", description: "", cost: "", qty: 1, price: "" },
      ],
    }));
  };

  const handleRemoveItem = (idx: number) => {
    setFormData((prev: any) => ({
      ...prev,
      items: prev.items.filter((_: any, i: any) => i !== idx),
    }));
  };

  const handleDueDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev: any) => ({
      ...prev,
      dueDay: value,
    }));
    setErrors((prev: any) => ({ ...prev, dueDay: "" }));
  };
  const getOption = () => {
    const option =
      userDropdown?.length > 0
        ? userDropdown?.map((user: any) => {
            return {
              label: user?.username,
              value: user?._id,
              email: user?.email,
              // address: user?.address || "",
              // bankName: user?.bankName || "",
              // accountNo: user?.accountNo || "",
              // ifscCode: user?.ifscCode || "",
            };
          })
        : [];
    return option;
  };

  // const onChangeEventHandlerSelect = (
  //   value: string | object | string[] | object[] | null,
  //   name: string
  // ): void => {
  //   let selectedValue;

  // };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      dispatch(getUserDropdown({ companyId: user.companyId, search: value }));
    }, 1000),
    [user.companyId]
  );

  const handleInputSelectChange = (value: string): void => {
    debouncedSearch(value);
  };
  useEffect(() => {
    if (user?.companyId) {
      dispatch(getAllCompanyUser({ companyId: user.companyId }));
    }
  }, [user]);

  const validateForm = () => {
    let newErrors: any = {};
    let isValid = true;

    if (!formData.createdDate) {
      newErrors.createdDate = "Created date is required";
      isValid = false;
    }
    if (!formData.dueDay || isNaN(formData.dueDay) || formData.dueDay < 0) {
      newErrors.dueDay = "Due day must be a non-negative number";
      isValid = false;
    }
    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
      isValid = false;
    }

    if (!formData.seller) {
      newErrors.seller = "Seller is required";
      isValid = false;
    }

    if (!formData.buyer) {
      newErrors.buyer = "buyer is required";
      isValid = false;
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "dueDate is required";
      isValid = false;
    }

    if (!formData.broker?.value) {
      newErrors.broker = "Broker is required";
      isValid = false;
    }
    if (!formData.items || formData.items.length === 0) {
      newErrors.items = "At least one item is required";
      isValid = false;
    } else {
      const itemsErrors: any = {};
      formData.items.forEach((item: any, idx: number) => {
        const itemErrors: any = {};
        if (!item.name) itemErrors.name = "Name is required";
        if (!item.description)
          itemErrors.description = "Description is required";
        if (isNaN(item.cost) || item.cost <= 0)
          itemErrors.cost = "Cost must be greater than 0";
        if (isNaN(item.qty) || item.qty <= 0)
          itemErrors.qty = "Quantity must be greater than 0";
        if (isNaN(item.price) || item.price <= 0)
          itemErrors.price = "Price must be greater than 0";
        if (Object.keys(itemErrors).length > 0) itemsErrors[idx] = itemErrors;
      });
      if (Object.keys(itemsErrors).length > 0) {
        newErrors.items = itemsErrors;
        isValid = false;
      }
    }

    if (isNaN(formData.discount) || formData.discount < 0) {
      newErrors.discount = "Discount cannot be negative";
      isValid = false;
    }

    if (isNaN(formData.tax) || formData.tax < 0) {
      newErrors.tax = "Tax cannot be negative";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      companyId: user?.companyId || "",
      billNo: formData?.billNo || "",
      invoiceType,
      createdDate: formData.createdDate
        ? dayjs(formData.createdDate).format("YYYY-MM-DD")
        : null,
      dueDate: formData.dueDate
        ? dayjs(formData.dueDate).format("YYYY-MM-DD")
        : null,
      sellerId: formData.seller?.value || null,
      buyerId: formData.buyer?.value || null,
      brokerId: formData.broker?.value || null,
      items: formData.items.map((item: any) => ({
        itemName: item.name,
        itemDescription: item.description,
        cost: item.cost,
        quantity: item.qty,
        price: item.price,
      })),
      subTotal: formData.subTotal,
      brokeragePercentage: formData.brokeragePercentage,
      brokerageAmount: formData.brokerageAmount,
      totalAmount: formData.totalAmount,
      discount: formData.discount,
      dueAmount: formData?.totalAmount,
      paidAmount: 0,
      note: formData.note || "",
    };
    await dispatch(createInvoice(payload));
    navigate("/invoice");
  };

  console.log("formData?.createdDate", formData);
  return (
    <Box className="w-full bg-gray-50 flex flex-col items-center py-6">
      {loading ? (
        <Box className="h-[550px] flex justify-center items-center">
          <CircularProgress />
        </Box>
      ) : (
        <Box className="flex gap-6 w-full max-w-6xl">
          <Card className="flex-1 p-8 rounded-xl shadow-sm !bg-white">
            <Box className="bg-gray-100 rounded-lg p-6 flex justify-between items-start mb-6">
              <Box className="flex items-center gap-4 w-[70%]">
                {/* Logo in white box */}
                <Box className="bg-white rounded-md flex items-center justify-center w-16 h-16 shadow">
                  <img
                    src={logoImage}
                    alt="Company Logo"
                    className="w-12 h-12 object-contain"
                    loading="lazy"
                  />
                </Box>
                <Box className="w-1/2">
                  <Box className="text-2xl font-semibold">
                    {company?.companyName}
                  </Box>
                  <Box className="text-gray-600 whitespace-break-spaces text-base mt-2">
                    {company?.address}
                    <br />
                    {company?.phone}
                  </Box>
                </Box>
              </Box>
              <Box className="flex flex-col gap-3 w-[30%]">
                <Box className="flex items-center justify-between ">
                  <span className="text-gray-500">Invoice</span>
                  <TextField
                    size="small"
                    value={`#${nextInvoiceNumber}`}
                    disabled
                    className="w-48"
                  />
                </Box>
                <Box className="flex items-center justify-between ">
                  <span className="text-gray-500">Bill Number:</span>
                  <TextField
                    size="small"
                    value={formData.billNo}
                    name="billNo"
                    className="w-48"
                    onChange={handleInputChange}
                    placeholder="Enter Bill Number"
                  />
                </Box>
                <Box className="flex items-center justify-between">
                  <span className="text-gray-500">Date Issued:</span>
                  <Box className="flex flex-col">
                    <DatePickerComponent
                      name="createdDate"
                      value={formData?.createdDate}
                      onChange={handleDateChange}
                    />
                    {errors?.createdDate && (
                      <span className="text-xs text-[red]">
                        {errors?.createdDate}
                      </span>
                    )}
                  </Box>
                </Box>
                <Box className="flex items-center justify-between">
                  <span className="text-gray-500">Due Day:</span>
                  <Box className="flex flex-col">
                    <TextField
                      size="small"
                      type="number"
                      name="dueDay"
                      value={formData.dueDay}
                      onChange={handleDueDayChange}
                      className="w-48"
                      placeholder="Enter Days"
                    />
                    {errors?.dueDay && (
                      <span className="text-xs text-[red]">
                        {errors?.dueDay}
                      </span>
                    )}
                    {formData.dueDate && (
                      <span className="text-xs text-gray-500 mt-1">
                        Due Date: {dayjs(formData.dueDate).format("YYYY-MM-DD")}
                      </span>
                    )}
                  </Box>
                </Box>
              </Box>
            </Box>
            <Box className="grid grid-cols-2">
              {invoiceType !== "sell" && (
                <Box className="">
                  {/* <Box className="flex items-center gap-x-1.5 text-[#A54EB0]">
                    {userSearchingLoader && (
                      <FaSpinner className="animate-spin" />
                    )}
                    <Box className="text-sm font-semibold">
                      {userSearchingMessage}
                    </Box>
                  </Box> */}
                  <Box className="!font-semibold !mb-1 text-gray-500">
                    Seller:
                  </Box>
                  {/* <SelectComponent
                    options={getOption()}
                    name="seller"
                    id="seller"
                    value={formData.seller}
                    onChange={(option: any) =>
                      handleSelectChange(option, "seller")
                    }
                  /> */}
                  <Autocomplete
                    className="mb-2.5"
                    freeSolo
                    options={getOption()}
                    id="seller"
                    value={formData.seller}
                    onChange={(_, option: any) =>
                      handleSelectChange(option, "seller")
                    }
                    onInputChange={(_, value) => {
                      handleInputSelectChange(value);
                    }}
                    renderOption={(props, option: any) => {
                      return (
                        <li {...props} key={props.id}>
                          {option.label ? option?.label : option}
                        </li>
                      );
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder="Please search"
                        className="!rounded-lg !px-1"
                        sx={{
                          "&.MuiTextField-root": {
                            border: "1px solid #d3d3d3",
                            "&:focus-within fieldset, &:focus-visible fieldset, & fieldset":
                              {
                                border: 0,
                                padding: 0,
                              },
                            "& .MuiInputBase-root": {
                              padding: 0,
                            },
                            "& .MuiOutlinedInput-root": {
                              "& input": {
                                color: "black",
                                paddingLeft: "10px",
                              },
                            },
                          },
                        }}
                      />
                    )}
                  />

                  {errors?.seller && (
                    <span className="text-xs text-[red]">{errors?.seller}</span>
                  )}
                  {formData?.seller && (
                    <Box className="!mt-2 !text-gray-600">
                      <Box>{formData?.seller?.email}</Box>
                    </Box>
                  )}
                </Box>
              )}

              <Box className="">
                {invoiceType !== "buy" && (
                  <>
                    {/* <Box className="flex items-center gap-x-1.5 text-[#A54EB0]">
                      {userSearchingLoader && (
                        <FaSpinner className="animate-spin" />
                      )}
                      <Box className="text-sm font-semibold">
                        {userSearchingMessage}
                      </Box>
                    </Box> */}
                    <Box className="!font-semibold !mb-1 text-gray-500">
                      Buyer:
                    </Box>
                    {/* <SelectComponent
                      options={getOption()}
                      name="buyer"
                      id="buyer"
                      value={formData.buyer}
                      onChange={(option: any) =>
                        handleSelectChange(option, "buyer")
                      }
                    /> */}
                    <Autocomplete
                      className="mb-2.5"
                      freeSolo
                      options={getOption()}
                      id="buyer"
                      value={formData.buyer}
                      onChange={(_, option: any) =>
                        handleSelectChange(option, "buyer")
                      }
                      onInputChange={(_, value) => {
                        handleInputSelectChange(value);
                      }}
                      renderOption={(props, option: any) => {
                        return (
                          <li {...props} key={props.id}>
                            {option.label ? option?.label : option}
                          </li>
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Please search"
                          className="!rounded-lg !px-1"
                          sx={{
                            "&.MuiTextField-root": {
                              border: "1px solid #d3d3d3",
                              "&:focus-within fieldset, &:focus-visible fieldset, & fieldset":
                                {
                                  border: 0,
                                  padding: 0,
                                },
                              "& .MuiInputBase-root": {
                                padding: 0,
                              },
                              "& .MuiOutlinedInput-root": {
                                "& input": {
                                  color: "black",
                                  paddingLeft: "10px",
                                },
                              },
                            },
                          }}
                        />
                      )}
                    />

                    {errors?.buyer && (
                      <span className="text-xs text-[red]">
                        {errors?.buyer}
                      </span>
                    )}
                    {formData?.buyer && (
                      <Box className="!mt-2 !text-gray-600">
                        <Box>{formData?.buyer?.email}</Box>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>
            <InvoiceItemsSection
              items={formData.items}
              handleItemChange={handleItemChange}
              handleAddItem={handleAddItem}
              handleRemoveItem={handleRemoveItem}
              errors={errors.items || {}}
            />
            <InvoiceSummarySection
              broker={formData.broker}
              note={formData.note}
              discount={formData.discount}
              tax={formData.tax}
              subTotal={formData.subTotal}
              handleSummaryChange={handleSummaryChange}
              handleInputSelectChange={handleInputSelectChange}
              getBrokerOption={getOption}
              items={formData.items}
              formData={formData}
              invoiceType={invoiceType}
              brokeragePercentage={formData?.brokeragePercentage}
              errors={errors}
            />
            <Box className="flex mt-3 justify-end">
              <Button
                size="small"
                variant="contained"
                className="!bg-[#3a2ae2b3] !text-xs !rounded-md !py-1.5 !capitalize"
                onClick={handleSave}
              >
                Save
              </Button>
            </Box>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default AddInvoice;
