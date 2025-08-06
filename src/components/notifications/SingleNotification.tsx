import { formatDateFn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import { Button } from "../ui/button";
import { Trash2Icon, TrashIcon, Undo2Icon } from "lucide-react";

const SingleNotification = ({ slug }: { slug: string }) => {
  const formatSlug = (slug: string) => {
    const formattedSlug = slug.replaceAll("%20", " ");
    return formattedSlug;
  };
  return (
    <div>
      <section className=" shadow-[0px_0px_4px_1px_#0000004D]">
        <header className="flex items-center justify-between gap-5 py-5 border-b px-4">
          <h2 className="font-medium text-lg text-black">
            <span className="underline">{formatSlug(slug)}</span>
          </h2>

          <Link
            href={"/dashboard/notifications/send"}
            className="text-base text-[#4E66A8] font-normal"
          >
            Send New Notification
          </Link>
        </header>
        <div className="px-6 py-8">
          <div className="bg-[#E6EBF0] flex py-7 px-8 pb-32 justify-between items-start">
            <div>{formatDateFn()}</div>
            <div className="flex flex-col gap-4 flex-1 ml-8">
              <div className="flex gap-2 items-center">
                <h2 className="text-black text-base font-semibold">Sender: </h2>
                <span className="text-[#595959] text-sm">Daniel James </span>
              </div>
              <div className="flex gap-2 items-center">
                <h2 className="text-black text-base font-semibold">Title: </h2>
                <span className="text-[#595959] text-sm">
                  Appointment Reminder
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <h2 className="text-black text-base font-semibold">Organization: </h2>
                <span className="text-[#595959] text-sm">JON-KEN Hospital </span>
              </div>
              <div className="flex gap-2 items-center">
                <h2 className="text-black text-base font-semibold">Email Address: </h2>
                <span className="text-[#595959] text-sm">jonkenhospitalgmail.com </span>
              </div>
              <div className="flex gap-2 items-center">
                <h2 className="text-black text-base font-semibold">Time: </h2>
                <span className="text-[#595959] text-sm">11:00am </span>
              </div>
              <div className="flex gap-2 items-start">
                <h2 className="text-black text-base font-semibold">Message: </h2>
                <span className="text-[#595959] text-sm">Lorem ipsum dolor sit amet consectetur. Cursus nec amet ipsum a. Faucibus volutpat quis cras aliquam a sed. Mattis............  </span>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Button className="bg-white p-0 h-9 w-9  !rounded-0  flex items-center justify-center">
                <Undo2Icon className=" text-[#003465] size-[16px]" />
              </Button>
              <Button className="bg-white p-0 h-9 w-9  !rounded-0  flex items-center justify-center">
                <Trash2Icon className=" text-red-500 size-[16px]" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SingleNotification;
