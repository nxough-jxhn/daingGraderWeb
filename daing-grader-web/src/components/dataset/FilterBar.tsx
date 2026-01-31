import React from 'react'

export default function FilterBar(){
  return (
    <div className="flex items-center gap-3">
      <input placeholder="Search images" className="px-3 py-2 border rounded-md w-full" />
      <select className="px-3 py-2 border rounded-md">
        <option>All types</option>
        <option>danggit</option>
        <option>bangus</option>
      </select>
      <button className="px-3 py-2 bg-gray-100 rounded-md">Filter</button>
    </div>
  )
}
