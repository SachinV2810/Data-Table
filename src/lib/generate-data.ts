// Run this script once to generate 100k student records: npx ts-node src/lib/generate-data.ts
import fs from "fs";
import path from "path";

const DEPARTMENTS = ["Science", "Commerce", "Arts"];
const COURSES = ["HSC", "BA", "BCom", "BSc"];
const STATUSES = ["Active", "Inactive"] as const;
const SEMESTERS = [1, 2, 3, 4, 5, 6];

const SCIENCE_SUBJECTS = [
  "Physics (HS) - PHY", "Chemistry (HS) - CHEM", "Mathematics (HS) - MATH",
  "Biology (HS) - BIO", "Computer Science (HS) - CS", "English (HS) - ENGL",
  "Environmental Studies - EVS", "Assamese (HS) - MASS",
];
const COMMERCE_SUBJECTS = [
  "Accountancy (HS) - ACOU", "Business Studies (HS) - BUST",
  "Economics (HS) - ECON", "Banking & Finance (HS) - BNKG",
  "Business Mathematics (HS) - BMS", "English (HS) - ENGL",
  "Alternative English (HS) - ALTE", "Environmental Studies - EVS",
];
const ARTS_SUBJECTS = [
  "Political Science (HS) - POLS", "History (HS) - HIST",
  "Sociology (HS) - SOC", "Education (HS) - EDU",
  "Assamese (HS) - MASS", "English (HS) - ENGL",
  "Alternative English (HS) - ALTE", "Environmental Studies - EVS",
];

const FIRST_NAMES = ["Raj","Sohan","Gaurav","Sanjib","Pritam","Sumit","Priya","Ankit","Rekha","Dipak","Mousumi","Rahul","Kabita","Nilufar","Bikash","Himashree","Partha","Tanmoy","Purnima","Arup","Ritu","Nayan","Bimal","Mita","Jyoti","Hema","Suresh","Kamala","Deepak","Sunita","Amit","Pooja","Ravi","Sita","Manoj","Gita","Vijay","Lata","Anil","Uma","Sunil","Meena","Ramesh","Radha","Vinod","Shanti","Ashok","Nirmala","Prakash","Savita"];
const LAST_NAMES = ["Das","Devi","Bora","Kalita","Gogoi","Nath","Choudhury","Begum","Medhi","Baruah","Hussain","Roy","Saikia","Sarma","Hazarika","Dutta","Sharma","Barman","Thakur","Ahmed","Islam","Singh","Paul","Biswas","Ghosh","Mondal","Mishra","Yadav","Jha","Patel"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSubjects(dept: string): string {
  const pool = dept === "Science" ? SCIENCE_SUBJECTS : dept === "Commerce" ? COMMERCE_SUBJECTS : ARTS_SUBJECTS;
  const count = 5 + Math.floor(Math.random() * 3);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).join(", ");
}

const students = Array.from({ length: 100000 }, (_, i) => {
  const dept = rand(DEPARTMENTS);
  const firstName = rand(FIRST_NAMES);
  const lastName = rand(LAST_NAMES);
  const name = `${firstName.toUpperCase()} ${lastName.toUpperCase()}`;
  const course = rand(COURSES);
  const year = 2020 + Math.floor(i / 25000);
  const rollNo = `${course}/${year}/${String(i + 1).padStart(6, "0")}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@school.edu`;
  const contact = `${6 + Math.floor(Math.random() * 4)}${String(Math.floor(Math.random() * 1e9)).padStart(9, "0")}`;

  return {
    id: i + 1,
    rollNo,
    course,
    department: dept,
    semester: rand(SEMESTERS),
    name,
    email,
    contact,
    subjects: pickSubjects(dept),
    status: Math.random() > 0.15 ? "Active" : "Inactive",
  };
});

const outPath = path.join(process.cwd(), "src/data/students-100k.json");
fs.writeFileSync(outPath, JSON.stringify(students));
console.log(`Generated ${students.length} students → ${outPath}`);
