import ItemReportForm from '../components/ItemReportForm'

/**
 * Page component for reporting a lost item.
 * Geniestudio daylight notebook container.
 */
export default function ReportLostPage() {
  return (
    <div
      className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12"
      style={{ background: '#ebf5ff' }}
    >
      <ItemReportForm type="LOST" />
    </div>
  )
}
