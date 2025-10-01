import React from 'react'
import EditTrainingGuidePage from './EditComponent'

const EditPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return (
    <div>
      <EditTrainingGuidePage params={{ id }} />
    </div>
  )
}

export default EditPage