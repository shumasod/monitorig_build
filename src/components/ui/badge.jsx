// badge.jsx
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500",
  {
    variants: {
      variant: {
        default: "border-transparent bg-blue-600 text-white hover:bg-blue-700",
        destructive: "border-transparent bg-red-600 text-white hover:bg-red-700",
        warning: "border-transparent bg-yellow-600 text-white hover:bg-yellow-700",
        outline: "border-gray-700 text-gray-200 hover:bg-gray-700",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Badge = ({ className, variant, ...props }) => {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
