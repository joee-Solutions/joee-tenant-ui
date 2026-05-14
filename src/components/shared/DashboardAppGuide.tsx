"use client";

import { Tour, type TourProps } from "antd";
import { useCallback, useEffect, useState } from "react";
import {
  hasCompletedDashboardAppGuide,
  markDashboardAppGuideCompleted,
} from "@/lib/dashboardAppGuideStorage";

const el = (selector: string) => document.querySelector(selector) as HTMLElement | null;

const isLgUp = () =>
  typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;

function buildSteps(): NonNullable<TourProps["steps"]> {
  // rc-tour types omit `() => HTMLElement | null`; targets are resolved at runtime.
  return [
    {
      title: "Welcome to LociCare",
      description:
        "This short tour highlights the main areas of your tenant console. Use Next to continue, or Skip tour to close anytime.",
      target: null,
      nextButtonProps: { children: "Next" },
    },
    {
      title: "Navigation",
      description: isLgUp()
        ? "Use the sidebar for Dashboard, Organization (list, active and inactive tenants), Notifications, Admin, Reports & Analytics, training guides, system settings, and logout."
        : "Tap the menu icon to open the sidebar. From there you can reach Dashboard, Organization, Notifications, Admin, Reports, settings, and logout.",
      target: () => {
        if (isLgUp()) {
          return el("[data-tour='guide-sidebar-desktop']");
        }
        return el("[data-tour='guide-mobile-menu']");
      },
      nextButtonProps: { children: "Next" },
    },
    {
      title: "Search",
      description:
        "Search across organizations, employees, and departments. Submit to open the global search results.",
      target: () => el("[data-tour='guide-search']"),
      nextButtonProps: { children: "Next" },
    },
    {
      title: "Notifications",
      description:
        "Open recent alerts here, or use the sidebar for the full notification list and sending notifications.",
      target: () => el("[data-tour='guide-notifications']"),
      nextButtonProps: { children: "Next" },
    },
    {
      title: "System settings",
      description:
        "Quick access to system settings. Training guides and more options are under Settings & Support in the sidebar.",
      target: () => el("[data-tour='guide-settings']"),
      nextButtonProps: { children: "Next" },
    },
    {
      title: "Your profile",
      description:
        "View your name and role, open your admin profile, adjust settings, or sign out.",
      target: () => el("[data-tour='guide-profile']"),
      nextButtonProps: { children: "Next" },
    },
    {
      title: "Main workspace",
      description:
        "The rest of the screen is your workspace—dashboards, organization detail, patients, appointments, and other tools load here.",
      target: () => el("[data-tour='guide-main-content']"),
      nextButtonProps: { children: "Done" },
    },
  ] as NonNullable<TourProps["steps"]>;
}

const DashboardAppGuide = () => {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<NonNullable<TourProps["steps"]>>([]);

  useEffect(() => {
    if (hasCompletedDashboardAppGuide()) return;

    const id = window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        setSteps(buildSteps());
        setOpen(true);
      }, 400);
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  const finish = useCallback(() => {
    markDashboardAppGuideCompleted();
    setOpen(false);
  }, []);

  const onClose = useCallback(() => {
    finish();
  }, [finish]);

  const onFinish = useCallback(() => {
    finish();
  }, [finish]);

  return (
    <Tour
      open={open}
      onClose={onClose}
      onFinish={onFinish}
      steps={steps}
      type="primary"
      zIndex={11000}
      closeIcon={null}
      actionsRender={(originNode) => (
        <div className="flex w-full items-center justify-between gap-2 pt-1">
          <button
            type="button"
            className="text-sm text-white underline-offset-2 hover:text-slate-800 hover:underline"
            onClick={onClose}
          >
            Skip tour
          </button>
          <div className="flex gap-2">{originNode}</div>
        </div>
      )}
    />
  );
};

export default DashboardAppGuide;
