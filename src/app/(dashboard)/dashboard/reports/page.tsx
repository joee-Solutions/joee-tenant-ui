import React, { Suspense } from 'react'
import Reports from './Reports'

const ReportsPageMain = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-[#003465] border-blue-200" />
        </div>
      }
    >
      <Reports />
    </Suspense>
  )
}

export default ReportsPageMain