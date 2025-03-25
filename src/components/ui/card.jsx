// card.jsx
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("rounded-lg border border-gray-700 bg-gray-800 shadow-sm", className)}
    {...props}
  />
))
Card.displayName = "Card"

// card-header.jsx
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

// card-title.jsx
const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight text-white", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"
