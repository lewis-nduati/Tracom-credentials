"use client";

import { useState } from "react";
import { ContentEditor, ContentViewer } from "~/components/editor";
import { AndamioCard, AndamioCardContent, AndamioCardHeader, AndamioCardTitle } from "~/components/andamio/andamio-card";
import { AndamioTabs, AndamioTabsContent, AndamioTabsList, AndamioTabsTrigger } from "~/components/andamio/andamio-tabs";
import { AndamioPageHeader } from "~/components/andamio";
import { AndamioText } from "~/components/andamio/andamio-text";
import { AndamioHeading } from "~/components/andamio/andamio-heading";
import type { JSONContent } from "@tiptap/core";

const sampleContent: JSONContent = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 1 },
      content: [{ type: "text", text: "Welcome to the Andamio Editor" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This is a powerful rich text editor built with ",
        },
        {
          type: "text",
          marks: [{ type: "bold" }],
          text: "Tiptap",
        },
        { type: "text", text: " and styled with " },
        {
          type: "text",
          marks: [{ type: "bold" }],
          text: "shadcn/ui",
        },
        { type: "text", text: " components." },
      ],
    },
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Features" }],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "bold" }],
                  text: "Rich text formatting",
                },
                {
                  type: "text",
                  text: " - Bold, italic, underline, strikethrough, and more",
                },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Headings" },
                { type: "text", text: " - H1 through H6" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Lists" },
                { type: "text", text: " - Bullet and ordered lists" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", marks: [{ type: "bold" }], text: "Links" },
                { type: "text", text: " - Select text and use the link button" },
              ],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  marks: [{ type: "bold" }],
                  text: "Code blocks",
                },
                { type: "text", text: " - With syntax highlighting" },
              ],
            },
          ],
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Try it out!" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Edit this content, switch to preview tab, or view the JSON structure.",
        },
      ],
    },
  ],
};

export default function EditorPage() {
  const [contentJson, setContentJson] = useState<JSONContent>(sampleContent);

  const handleContentChange = (content: JSONContent) => {
    setContentJson(content);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <AndamioPageHeader
        title="Tiptap Editor Demo"
        description="A rich text editor built with Tiptap and shadcn/ui"
      />

      {/* Editor Tabs */}
      <AndamioTabs defaultValue="edit" className="space-y-4">
        <AndamioTabsList>
          <AndamioTabsTrigger value="edit">Edit</AndamioTabsTrigger>
          <AndamioTabsTrigger value="preview">Preview</AndamioTabsTrigger>
          <AndamioTabsTrigger value="json">JSON</AndamioTabsTrigger>
        </AndamioTabsList>

        <AndamioTabsContent value="edit" className="space-y-4">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Editor</AndamioCardTitle>
            </AndamioCardHeader>
            <AndamioCardContent className="space-y-4">
              <ContentEditor
                content={contentJson}
                onContentChange={handleContentChange}
                minHeight="400px"
                showWordCount
                placeholder="Start writing..."
              />
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        <AndamioTabsContent value="preview">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>Preview (Read-only)</AndamioCardTitle>
            </AndamioCardHeader>
            <AndamioCardContent>
              <ContentViewer content={contentJson} />
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>

        <AndamioTabsContent value="json">
          <AndamioCard>
            <AndamioCardHeader>
              <AndamioCardTitle>JSON Output</AndamioCardTitle>
            </AndamioCardHeader>
            <AndamioCardContent>
              <pre className="rounded-lg bg-muted p-4 text-sm overflow-x-auto">
                <code>
                  {JSON.stringify(contentJson, null, 2)}
                </code>
              </pre>
            </AndamioCardContent>
          </AndamioCard>
        </AndamioTabsContent>
      </AndamioTabs>

      {/* Extension Kits Info */}
      <AndamioCard>
        <AndamioCardHeader>
          <AndamioCardTitle>Extension Kits</AndamioCardTitle>
        </AndamioCardHeader>
        <AndamioCardContent className="space-y-4">
          <div>
            <AndamioHeading level={3} size="base" className="mb-2">Available Extension Kits:</AndamioHeading>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-sm border p-4">
                <AndamioHeading level={4} size="base" className="font-medium mb-1">BaseExtensionKit</AndamioHeading>
                <AndamioText variant="small">
                  Core extensions for basic text editing
                </AndamioText>
              </div>
              <div className="rounded-sm border p-4">
                <AndamioHeading level={4} size="base" className="font-medium mb-1">BasicEditorKit</AndamioHeading>
                <AndamioText variant="small">
                  Text formatting with lists and links
                </AndamioText>
              </div>
              <div className="rounded-sm border p-4">
                <AndamioHeading level={4} size="base" className="font-medium mb-1">ReadOnlyExtensionKit</AndamioHeading>
                <AndamioText variant="small">
                  For displaying content without editing
                </AndamioText>
              </div>
              <div className="rounded-sm border p-4">
                <AndamioHeading level={4} size="base" className="font-medium mb-1">FullEditorKit</AndamioHeading>
                <AndamioText variant="small">
                  All features including images and menus
                </AndamioText>
              </div>
            </div>
          </div>
        </AndamioCardContent>
      </AndamioCard>
    </div>
  );
}
