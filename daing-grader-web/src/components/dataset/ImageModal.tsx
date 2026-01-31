import React from 'react'
import Modal from '../ui/Modal'

export default function ImageModal({open, onClose}:{open:boolean, onClose:()=>void}){
  return (
    <Modal open={open} title="Image preview" onClose={onClose}>
      <div className="w-full h-80 bg-gray-100 flex items-center justify-center text-muted">Full image (placeholder) — 1200x800</div>
    </Modal>
  )
}
