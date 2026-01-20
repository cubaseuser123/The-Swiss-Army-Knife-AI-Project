# AI Elements Component Reference

This document lists all available components from the `ai-elements` package installed in this project.

## Available Component Files

| File | Purpose |
|------|---------|
| `prompt-input.tsx` | Chat input form, textarea, submit button |
| `message.tsx` | Chat message display, streaming markdown |
| `conversation.tsx` | Message list container with scroll |
| `loader.tsx` | Loading indicators |
| `reasoning.tsx` | AI reasoning/thinking display |
| `suggestion.tsx` | Quick reply suggestions |
| `tool.tsx` | Tool invocation UI |
| `sources.tsx` | Citation/source display |
| `code-block.tsx` | Syntax highlighted code |
| `model-selector.tsx` | Model picker dropdown |

---

## Prompt Input Components

**Import from:** `@/components/ai-elements/prompt-input`

### Main Components
| Component | Description |
|-----------|-------------|
| `PromptInput` | Root form wrapper with file handling |
| `PromptInputBody` | Container for textarea |
| `PromptInputTextarea` | The text input field (⚠️ NOT `PromptTextArea`) |
| `PromptInputSubmit` | Submit button with status icons |
| `PromptInputFooter` | Bottom bar with `justify-between` layout |
| `PromptInputHeader` | Top bar container |
| `PromptInputTools` | Flex container for action buttons |
| `PromptInputButton` | Generic button |

### Attachments
| Component | Description |
|-----------|-------------|
| `PromptInputAttachment` | Single file preview |
| `PromptInputAttachments` | Container for attachments |
| `PromptInputActionAddAttachments` | "Add file" button |

### Action Menu (Dropdown)
| Component | Description |
|-----------|-------------|
| `PromptInputActionMenu` | Dropdown root |
| `PromptInputActionMenuTrigger` | Menu open button |
| `PromptInputActionMenuContent` | Menu content |
| `PromptInputActionMenuItem` | Menu item |

### Select (Model Picker)
| Component | Description |
|-----------|-------------|
| `PromptInputSelect` | Select root |
| `PromptInputSelectTrigger` | Select button |
| `PromptInputSelectContent` | Dropdown content |
| `PromptInputSelectItem` | Option item |
| `PromptInputSelectValue` | Selected value display |

### Types
| Type | Description |
|------|-------------|
| `PromptInputMessage` | `{ text: string, files: FileUIPart[] }` |

---

## Message Components

**Import from:** `@/components/ai-elements/message`

| Component | Description |
|-----------|-------------|
| `Message` | Root wrapper, takes `from="user"` or `from="assistant"` |
| `MessageContent` | Content container with styling |
| `MessageResponse` | Renders streaming markdown (uses Streamdown) |
| `MessageActions` | Container for action buttons |
| `MessageAction` | Individual action button |
| `MessageAttachment` | File attachment display |
| `MessageAttachments` | Container for attachments |
| `MessageToolbar` | Bottom toolbar |
| `MessageBranch` | Multiple response versions |
| `MessageBranchContent` | Branch content area |
| `MessageBranchSelector` | Branch navigation |
| `MessageBranchPrevious` | Previous branch button |
| `MessageBranchNext` | Next branch button |
| `MessageBranchPage` | "X of Y" indicator |

---

## Conversation Components

**Import from:** `@/components/ai-elements/conversation`

| Component | Description |
|-----------|-------------|
| `Conversation` | Scrollable message container |
| `ConversationContent` | Content wrapper |
| `ConversationScrollButton` | "Scroll to bottom" button |

---

## Loader Components

**Import from:** `@/components/ai-elements/loader`

| Component | Description |
|-----------|-------------|
| `Loader` | Animated loading indicator |

---

## ❌ Components That DON'T Exist (Common Mistakes)

| Wrong | Correct |
|-------|---------|
| `Response` | `MessageResponse` (from message.tsx) |
| `PromptTextArea` | `PromptInputTextarea` |
| `PromptInputToolbar` | `PromptInputFooter` or `PromptInputTools` |
| `ChatInput` | `PromptInput` |

---

## Basic Usage Example

```tsx
"use client";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Loader } from "@/components/ai-elements/loader";

export default function Chat() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto p-4">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map((msg) => (
            <Message key={msg.id} from={msg.role}>
              <MessageContent>
                {msg.parts.map((part, i) =>
                  part.type === "text" ? (
                    <MessageResponse key={i}>{part.text}</MessageResponse>
                  ) : null
                )}
              </MessageContent>
            </Message>
          ))}
          {status === "streaming" && <Loader />}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <PromptInput
        onSubmit={(message) => sendMessage({ text: message.text })}
      >
        <PromptInputBody>
          <PromptInputTextarea />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools />
          <PromptInputSubmit status={status} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
```
