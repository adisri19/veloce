"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Avatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Lock, Send, CornerDownRight, Eye, Edit3 } from "lucide-react";
import { useNotes, useCreateNote } from "@/hooks/use-notes";
import { useQuery } from "@tanstack/react-query";

export function NotesTab({ dossier }: { dossier: any }) {
  const { data: notes = [] } = useNotes(dossier.id);
  const createNoteMutation = useCreateNote(dossier.id);

  const [content, setContent] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [replyParentId, setReplyParentId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);

  // Fetch users for @mention suggestions
  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/v1/users");
      const json = await res.json();
      return json.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const handleCreateRootNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    // Detect @mentions
    const mentions = users
      .filter((u) => content.includes(`@${u.name}`))
      .map((u) => u.id);

    await createNoteMutation.mutateAsync({
      content,
      isPrivate,
      mentions,
    });

    setContent("");
    setIsPreview(false);
  };

  const handleCreateReply = async (parentId: string) => {
    if (!replyContent.trim()) return;

    const mentions = users
      .filter((u) => replyContent.includes(`@${u.name}`))
      .map((u) => u.id);

    await createNoteMutation.mutateAsync({
      content: replyContent,
      parentId,
      isPrivate: false,
      mentions,
    });

    setReplyParentId(null);
    setReplyContent("");
  };

  const insertMention = (name: string) => {
    setContent((prev) => `${prev} @${name} `);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Top Composer */}
      <form onSubmit={handleCreateRootNote} className="p-4 bg-canvas border border-hairline rounded-lg flex flex-col gap-3">
        <div className="flex items-center justify-between border-b border-hairline/60 pb-2">
          <span className="text-xs font-semibold text-fg uppercase tracking-wider">
            Collaborative Candidate Note
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreview(!isPreview)}
              className="flex items-center gap-1 text-[11px] text-fg-muted hover:text-fg px-2 py-0.5 rounded border border-hairline"
            >
              {isPreview ? <Edit3 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{isPreview ? "Edit" : "Preview"}</span>
            </button>
            <label className="flex items-center gap-1.5 text-xs text-fg-muted cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded accent-primary"
              />
              <span className="flex items-center gap-1 text-[11px]">
                <Lock className="w-3 h-3" /> Private (HR Only)
              </span>
            </label>
          </div>
        </div>

        {isPreview ? (
          <div className="min-h-[80px] p-3 bg-panel border border-hairline rounded text-xs leading-relaxed prose prose-invert prose-xs max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "*Nothing to preview*"}
            </ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add notes with Markdown, mention teammates with @Name..."
            rows={3}
            className="w-full bg-panel text-fg placeholder:text-fg-muted/60 border border-hairline rounded p-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          />
        )}

        {/* Quick mention pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-fg-muted mr-1">Mention:</span>
          {users.slice(0, 4).map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => insertMention(u.name)}
              className="text-[11px] px-2 py-0.5 rounded bg-hairline/50 hover:bg-hairline text-fg font-medium transition-colors"
            >
              @{u.name}
            </button>
          ))}
        </div>

        <div className="flex justify-end mt-1">
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={!content.trim() || createNoteMutation.isPending}
            isLoading={createNoteMutation.isPending}
            icon={<Send className="w-3 h-3" />}
          >
            Post Note
          </Button>
        </div>
      </form>

      {/* Notes Thread */}
      <div className="flex flex-col gap-4">
        <span className="text-xs font-semibold text-fg uppercase tracking-wider">
          Thread History ({notes.length} Topics)
        </span>

        {notes.length > 0 ? (
          notes.map((note: any) => (
            <div
              key={note.id}
              className={`p-4 bg-canvas border rounded-lg flex flex-col gap-3 ${
                note.isPrivate ? "border-amber-500/30 bg-amber-500/5" : "border-hairline"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Avatar name={note.author.name} src={note.author.avatarUrl} size="sm" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-fg">{note.author.name}</span>
                    <span className="text-[10px] text-fg-muted font-mono">
                      {new Date(note.createdAt).toLocaleDateString()} at{" "}
                      {new Date(note.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                {note.isPrivate && (
                  <span className="flex items-center gap-1 text-[10px] text-amber-500 bg-warn-surface px-1.5 py-0.5 rounded border border-warn/30 font-semibold uppercase">
                    <Lock className="w-2.5 h-2.5" /> HR Private
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="text-xs leading-relaxed text-fg prose prose-invert prose-xs max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{note.content}</ReactMarkdown>
              </div>

              {/* Thread replies */}
              {note.replies && note.replies.length > 0 && (
                <div className="flex flex-col gap-2.5 pl-6 border-l-2 border-hairline mt-2 pt-2">
                  {note.replies.map((reply: any) => (
                    <div key={reply.id} className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-2">
                        <Avatar name={reply.author.name} src={reply.author.avatarUrl} size="xs" />
                        <span className="font-semibold text-fg text-[11px]">{reply.author.name}</span>
                        <span className="text-[10px] text-fg-muted font-mono">
                          {new Date(reply.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="pl-6 text-fg-muted text-xs leading-relaxed">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{reply.content}</ReactMarkdown>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply toggle & composer */}
              {replyParentId === note.id ? (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-hairline/60">
                  <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    className="flex-1 bg-panel border border-hairline rounded px-3 py-1.5 text-xs text-fg focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  <Button size="xs" variant="primary" onClick={() => handleCreateReply(note.id)}>
                    Reply
                  </Button>
                  <Button size="xs" variant="ghost" onClick={() => setReplyParentId(null)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setReplyParentId(note.id)}
                  className="self-start flex items-center gap-1 text-[11px] text-fg-muted hover:text-fg pt-1 cursor-pointer"
                >
                  <CornerDownRight className="w-3 h-3" />
                  <span>Reply in thread</span>
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center border border-dashed border-hairline rounded-lg text-fg-muted text-xs">
            No notes or collaborative messages recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
