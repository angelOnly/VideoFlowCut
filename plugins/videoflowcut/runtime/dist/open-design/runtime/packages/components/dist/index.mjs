import "./index.css";

// src/button.tsx
import { forwardRef } from "react";

// src/class-names.ts
function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(" ") || void 0;
}

// src/button.module.css
var button_default = {
  button: "button_button",
  primary: "button_primary",
  primaryGhost: "button_primaryGhost",
  ghost: "button_ghost",
  subtle: "button_subtle",
  secondary: "button_secondary",
  icon: "button_icon",
  sm: "button_sm"
};

// src/button.tsx
import { jsx } from "react/jsx-runtime";
var variantClassNames = {
  default: void 0,
  primary: joinClassNames(button_default.primary, "primary"),
  "primary-ghost": joinClassNames(button_default.primaryGhost, "primary-ghost"),
  ghost: joinClassNames(button_default.ghost, "ghost"),
  subtle: joinClassNames(button_default.subtle, "subtle"),
  // chat 设计稿的 .btn.mod-secondary:白底细描边,hover 只加深描边与字色。
  // 不挂旧的全局兼容类 —— 新变体不再扩散裸 primitive 类名。
  secondary: button_default.secondary
};
var sizeClassNames = {
  default: void 0,
  icon: joinClassNames(button_default.icon, "icon-btn"),
  // chat 设计稿的 .btn.mod-sm:26px 高、12px/600、胶囊角。设计稿里 chat 面板
  // 全部 28 个按钮都是这一档,没有一个用默认尺寸。
  sm: button_default.sm
};
var Button = forwardRef(function Button2({ className, type = "button", variant = "default", size = "default", ...props }, ref) {
  return /* @__PURE__ */ jsx(
    "button",
    {
      ref,
      type,
      className: joinClassNames(
        button_default.button,
        variantClassNames[variant],
        sizeClassNames[size],
        className
      ),
      ...props
    }
  );
});

// src/dialog.tsx
import {
  useEffect
} from "react";
import { createPortal } from "react-dom";

// src/dialog.module.css
var dialog_default = {
  backdrop: "dialog_backdrop",
  "dialog-backdrop-fade-in": "dialog_dialog-backdrop-fade-in",
  dialog: "dialog_dialog",
  "dialog-panel-pop-in": "dialog_dialog-panel-pop-in",
  dialogSectioned: "dialog_dialogSectioned",
  header: "dialog_header",
  body: "dialog_body",
  footer: "dialog_footer",
  title: "dialog_title",
  description: "dialog_description"
};

// src/dialog.tsx
import { jsx as jsx2 } from "react/jsx-runtime";
function Dialog({
  children,
  onClose,
  className,
  backdropClassName,
  includeChromeClassName = true,
  id,
  role = "dialog",
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  closeOnBackdrop = true,
  closeOnEscape = false,
  layout = "default",
  as = "div",
  onSubmit,
  ...dataAttributes
}) {
  useEffect(() => {
    if (!onClose || !closeOnEscape) return;
    function handleKeyDown(event) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose?.();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeOnEscape, onClose]);
  const sharedProps = {
    id,
    className: joinClassNames(
      includeChromeClassName ? dialog_default.dialog : void 0,
      includeChromeClassName && layout === "sectioned" ? dialog_default.dialogSectioned : void 0,
      includeChromeClassName ? "modal" : void 0,
      className
    ),
    onClick: (event) => event.stopPropagation(),
    role,
    "aria-modal": "true",
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedBy,
    ...dataAttributes
  };
  const overlay = /* @__PURE__ */ jsx2(
    "div",
    {
      className: joinClassNames(
        includeChromeClassName ? dialog_default.backdrop : void 0,
        includeChromeClassName ? "modal-backdrop" : void 0,
        backdropClassName
      ),
      onClick: closeOnBackdrop ? onClose : void 0,
      role: "presentation",
      children: as === "form" ? /* @__PURE__ */ jsx2("form", { ...sharedProps, onSubmit, children }) : /* @__PURE__ */ jsx2("div", { ...sharedProps, children })
    }
  );
  if (typeof document === "undefined") return overlay;
  return createPortal(overlay, document.body);
}
function DialogHeader({ className, ...props }) {
  return /* @__PURE__ */ jsx2("div", { className: joinClassNames(dialog_default.header, className), ...props });
}
function DialogBody({ className, ...props }) {
  return /* @__PURE__ */ jsx2("div", { className: joinClassNames(dialog_default.body, className), ...props });
}
function DialogFooter({ className, ...props }) {
  return /* @__PURE__ */ jsx2("div", { className: joinClassNames(dialog_default.footer, className), ...props });
}
function DialogTitle({ className, ...props }) {
  return /* @__PURE__ */ jsx2("h2", { className: joinClassNames(dialog_default.title, className), ...props });
}
function DialogDescription({ className, ...props }) {
  return /* @__PURE__ */ jsx2("p", { className: joinClassNames(dialog_default.description, className), ...props });
}

// src/form-controls.tsx
import { forwardRef as forwardRef2 } from "react";

// src/form-controls.module.css
var form_controls_default = {
  control: "form_controls_control",
  textarea: "form_controls_textarea",
  select: "form_controls_select"
};

// src/form-controls.tsx
import { jsx as jsx3 } from "react/jsx-runtime";
var Input = forwardRef2(function Input2({ className, ...props }, ref) {
  return /* @__PURE__ */ jsx3("input", { ref, className: joinClassNames(form_controls_default.control, className), ...props });
});
var Textarea = forwardRef2(function Textarea2({ className, ...props }, ref) {
  return /* @__PURE__ */ jsx3("textarea", { ref, className: joinClassNames(form_controls_default.control, form_controls_default.textarea, className), ...props });
});
var Select = forwardRef2(function Select2({ className, ...props }, ref) {
  return /* @__PURE__ */ jsx3("select", { ref, className: joinClassNames(form_controls_default.control, form_controls_default.select, className), ...props });
});

// src/visually-hidden.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
function VisuallyHidden({ children, className, ...props }) {
  return /* @__PURE__ */ jsx4("span", { className: joinClassNames("sr-only", className), ...props, children });
}
export {
  Button,
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Select,
  Textarea,
  VisuallyHidden
};
