const React = require("react");

function Button({ children, className = "", onClick, ...props }) {
  return React.createElement(
    "button",
    {
      className: `px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors duration-200 ${className}`,
      onClick,
      ...props
    },
    children
  );
}

function Badge({ children, variant = "info", className = "" }) {
  const styles = {
    info: "bg-blue-100 text-blue-800",
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-800"
  };

  return React.createElement(
    "span",
    {
      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant] || styles.info} ${className}`
    },
    children
  );
}

module.exports = {
  Button,
  Badge
};
