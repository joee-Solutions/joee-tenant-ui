import React, { Suspense } from 'react'
import Reports from './Reports'

const ReportsPageMain = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Reports />
    </Suspense>
  )
}

export default ReportsPageMain