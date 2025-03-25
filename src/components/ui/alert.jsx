// alert.jsx
const Alert = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(
      "relative rounded-lg border p-4",
      {
        "bg-red-950/50 border-red-600 text-red-400": variant === "destructive",
        "bg-yellow-950/50 border-yellow-600 text-yellow-400": variant === "warning",
        "bg-blue-950/50 border-blue-600 text-blue-400": variant === "info",
        "bg-gray-800 border-gray-700 text-gray-200": variant === "default"
      },
      className
    )}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"
