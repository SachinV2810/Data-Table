# Student List — Next.js App

A beautiful, feature-rich student management table built with:
- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React** icons

## Features

| Feature | Details |
|---|---|
| 🔍 Global Search | Indexed search across ALL fields |
| 🎛️ Dropdown Filters | Filter by Department, Semester, Status, Course |
| 🔢 Column Filters | Per-column text filter row (toggle on/off) |
| ↕️ Sorting | Click any sortable column header |
| 🖨️ Print | Clean print layout (toolbar hidden) |
| 📥 CSV Export | Download filtered data as CSV |
| 📊 Excel Export | Download filtered data as TSV/Excel |
| 📄 Pagination | 10/25/50/100 rows per page, page navigation |
| 👤 Detail Modal | Click action button to see full student info |
| 📊 Stats Cards | Live count cards (total, active, inactive, depts) |

## Getting Started

```bash
cd student-list
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Adding Your JSON Data

Replace `src/data/students.json` with your own data. Each student object should have:

```json
{
  "id": 1,
  "rollNo": "HSC/2024/001",
  "course": "HSC",
  "department": "Science",
  "semester": 2,
  "name": "STUDENT NAME",
  "email": "student@school.edu",
  "contact": "9876543210",
  "subjects": "Subject1 - CODE1, Subject2 - CODE2",
  "status": "Active"
}
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Root page (server component)
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/students/
│   ├── StudentListPage.tsx   # Main orchestrating component
│   ├── StudentTable.tsx      # Table with sorting & column filters
│   ├── SearchBar.tsx         # Global search input
│   ├── FilterBar.tsx         # Dropdown filters
│   ├── ActionBar.tsx         # Print / CSV / Excel buttons
│   ├── Pagination.tsx        # Page navigation
│   ├── StatsCards.tsx        # Summary stat cards
│   └── StudentDetailModal.tsx # Detail view modal
├── data/
│   └── students.json         # Your student data
└── lib/
    ├── types.ts              # TypeScript interfaces
    └── utils.ts              # Search index, filter, export helpers
```
