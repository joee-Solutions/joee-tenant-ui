"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/Textarea";
import Link from "next/link";

const noficationSchema = z.object({
  title: z.string().min(1, "nofication name is required"),
  sender: z.string(),
  recieverEmail: z.string().email("Invalid email address"),
  receiverOrg: z.string(),
  date: z.string(),
  document: z.string(),
  noficationDescription: z
    .string()
    .min(1, "nofication description is required"),
});

type noficationSchemaType = z.infer<typeof noficationSchema>;

export default function AddNofication() {
  const router = useRouter();

  const form = useForm<noficationSchemaType>({
    resolver: zodResolver(noficationSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      noficationDescription: "",
    },
  });

  const onSubmit = (data: noficationSchemaType) => {
    console.log(data);
    // Handle form submission
  };

  return (
    <div className="py-8 p-[29px_14px_30px_24px] my-8 shadow-[0px_0px_4px_1px_#0000004D]">
      <div className="flex justify-between items-center border-b-2  py-4 mb-8">
        <h1 className="font-semibold text-xl text-black">Add Nofication</h1>
        <Link
          className="text-base text-[#003465] font-normal"
          href={"/dashboard/notifications"}
        >
          Nofication List
        </Link>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="mb-4 flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-6 ">
          <div className="flex-1">
            <label className="block text-base text-black font-normal mb-2">
              Sender
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("sender")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block text-base text-black font-normal mb-2">
              Title
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("title")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>
        </div>
        <div className="mb-4 flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-6 ">
          <div className="flex-1">
            <label className="block text-base text-black font-normal mb-2">
              Receiver’s organization Email
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("recieverEmail")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block text-base text-black font-normal mb-2">
              Receiver’s organization
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("receiverOrg")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>
        </div>
        <div className="mb-4 flex flex-col space-y-6 md:flex-row md:space-y-0 md:space-x-6 ">
          <div className="flex-1">
            <label className="block text-base text-black font-normal mb-2">
              Date
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("date")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>
          <div className="flex-1">
            <label className="block text-base text-black font-normal mb-2">
              Upload Document
            </label>
            <Input
              placeholder="Enter here"
              {...form.register("document")}
              className="w-full h-14 p-3 border border-[#737373] rounded"
            />
          </div>
        </div>

        <div className="">
          <label className="block text-base text-black font-normal mb-2">
            Nofication Description
          </label>
          <Textarea
            placeholder="Your Message"
            {...form.register("noficationDescription")}
            className="w-full p-3 min-h-52 border border-[#737373] rounded"
          />
        </div>

        <div className="flex space-x-4 pt-4 ">
          <Button
            type="submit"
            className=" bg-[#003465] hover:bg-[#0d2337] text-white py-8 px-16 text-md rounded"
          >
            Send Notification
          </Button>
          <Button
            type="button"
            className=" border border-[#EC0909] text-[#EC0909] hover:bg-[#ec090922] py-8 px-16 text-md rounded"
            onClick={() => router.back()}
          >
            Cancel 
          </Button>
        </div>
      </form>
    </div>
  );
}
