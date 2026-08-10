# Upstep Operations Admin Web Application

Comprehensive Coach Scheduling, Shift Template Management, Trainers Roster, and Daily Slots 2.0 (Demo Slots Hub) Operations System for Upstep.

## 🚀 Key Features

1. **Master Schedule Grid**: Full 7-day operations grid with operational category highlights (*Requirement Block, Notice Period, Report-building time, Level Breaks*), RM assignment (*Vedant Kamble, Sana Choudhary, etc.*), and Trainer assignment (*Sujay Mondal, Shubham Kumthekar, etc.*).
2. **Trainers Roster & Operations Hub**: Manages Head Trainer (**Shubham Kumthekar**) and 6 Trainers (**Sujay Mondal, Sairaj Chittal, Pratik Gengaje, Pratik Gaitonde, Vatsal Shah, Harsh Ghag**) along with their assigned coaches.
3. **Daily Slots 2.0 (Demo Slots Management Hub)**: Date-wise Demo Slot Automation matching Google Sheets Daily Slots 2.0. Automatically fetches X slots & purple inactive slots, splits each 45-min master slot into two 20-min demo sub-slots with a 5-min rest break, displays coach demo preferences, flags no-demo ineligible coaches in pink (`#EA9999`), and provides interactive booking.
4. **Multi-Day Availability Finder**: Search open demo / sub slots across multi-day combinations (*Mon & Fri, Tue & Thu, etc.*) with auto capacity checking.
5. **Conflict Diagnostic Audit**: Real-time validation rules checking for overlaps, capacity limits, consecutive session limits, and rest break violations.
6. **Dual Theme Support**: Crisp Light Mode & Glassmorphic Dark Mode toggle.

## 🛠️ Getting Started

### Installation

```bash
# Install dependencies
npm install

# Run local development server
npm run dev
```

Open `http://localhost:5173/` in your browser.

### Building for Production

```bash
npm run build
```
