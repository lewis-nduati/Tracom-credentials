import React from "react";
import { StudioLayout } from "~/components/layout/studio-layout";

export default function StudioLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudioLayout>{children}</StudioLayout>;
}
