# School Management System Documentation

## Overview
Complete school management system for Rwanda TVET Board (RTB) asset management with comprehensive CRUD operations, role-based access control, and Rwanda administrative hierarchy support.

## Features

### 1. School Entity
- **Identification**: Unique school code, name, category (TSS, VTC, Other)
- **Location**: Rwanda administrative structure
  - Province (5 provinces: Kigali, Eastern, Northern, Southern, Western)
  - District
  - Sector
  - Cell (optional)
  - Village (optional)
- **Contact Information**: Email, phone number, address (all optional)
- **Representative**: Link to User with 'school' role (nullable, SET NULL on delete)
- **Status**: Active/Inactive

### 2. Database Schema
```typescript
@Entity("schools")
export class School {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  schoolCode: string;

  @Column()
  schoolName: string;

  @Column({ type: "enum", enum: SchoolCategory })
  category: SchoolCategory; // TSS, VTC, Other

  @Column()
  province: string;

  @Column()
  district: string;

  @Column()
  sector: string;

  @Column({ nullable: true })
  cell?: string;

  @Column({ nullable: true })
  village?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  address?: string;

  @Column({ type: "uuid", nullable: true })
  representativeId?: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "representativeId" })
  representative?: User;

  @Column({ type: "enum", enum: SchoolStatus, default: SchoolStatus.ACTIVE })
  status: SchoolStatus; // Active, Inactive

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

### 3. API Endpoints

#### GET /api/schools
Get all schools with pagination and filtering.

**Query Parameters:**
- `page` (number, default: 1)
- `limit` (number, default: 10)
- `search` (string, optional) - Search by school code or name
- `category` (TSS | VTC | Other, optional)
- `status` (Active | Inactive, optional)
- `province` (string, optional)
- `district` (string, optional)

**Authorization:**
- Admin/RTB-Staff: View all schools
- School role: Only view assigned schools

**Response:**
```json
{
  "success": true,
  "message": "Schools retrieved successfully",
  "data": {
    "schools": [
      {
        "id": "uuid",
        "schoolCode": "TSS001",
        "schoolName": "Kigali Technical School",
        "category": "TSS",
        "province": "Kigali",
        "district": "Gasabo",
        "sector": "Remera",
        "representative": {
          "id": "uuid",
          "fullName": "John Doe",
          "email": "john@example.com"
        },
        "status": "Active"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

#### GET /api/schools/stats
Get school statistics.

**Authorization:** Admin, RTB-Staff

**Response:**
```json
{
  "success": true,
  "message": "School statistics retrieved successfully",
  "data": {
    "total": 50,
    "byCategory": {
      "TSS": 25,
      "VTC": 20,
      "Other": 5
    },
    "byStatus": {
      "Active": 45,
      "Inactive": 5
    },
    "withRepresentative": 40,
    "withoutRepresentative": 10
  }
}
```

#### GET /api/schools/:id
Get a single school by ID.

**Authorization:**
- Admin/RTB-Staff: View any school
- School role: Only view assigned school

#### POST /api/schools
Create a new school.

**Authorization:** Admin, RTB-Staff

**Request Body:**
```json
{
  "schoolCode": "TSS001",
  "schoolName": "Kigali Technical School",
  "category": "TSS",
  "province": "Kigali",
  "district": "Gasabo",
  "sector": "Remera",
  "cell": "Rukiri",
  "village": "Kibagabaga",
  "email": "info@kts.rw",
  "phoneNumber": "+250788123456",
  "address": "KG 123 St",
  "representativeId": "uuid",
  "status": "Active"
}
```

**Validation:**
- `schoolCode` must be unique
- `representativeId` must be a user with 'school' role (if provided)
- All required fields must be present

#### POST /api/schools/bulk
Bulk create schools.

**Authorization:** Admin, RTB-Staff

**Request Body:**
```json
{
  "schools": [
    {
      "schoolCode": "TSS001",
      "schoolName": "School 1",
      "category": "TSS",
      "province": "Kigali",
      "district": "Gasabo",
      "sector": "Remera",
      "status": "Active"
    },
    {
      "schoolCode": "VTC001",
      "schoolName": "School 2",
      "category": "VTC",
      "province": "Eastern",
      "district": "Rwamagana",
      "sector": "Rubona",
      "status": "Active"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk school creation completed",
  "data": {
    "successful": 2,
    "failed": 0,
    "errors": []
  }
}
```

#### PATCH /api/schools/:id
Update a school.

**Authorization:**
- Admin/RTB-Staff: Can update all fields
- School role: Can only update email, phoneNumber, address of their assigned school

**Request Body:** Same as POST /api/schools

#### DELETE /api/schools/:id
Delete a school.

**Authorization:** Admin, RTB-Staff

### 4. Role-Based Access Control

#### Admin & RTB-Staff
- ✅ View all schools
- ✅ Create schools (single & bulk)
- ✅ Update all school fields
- ✅ Delete schools
- ✅ Assign/change representatives
- ✅ View statistics

#### School Role
- ✅ View only assigned school(s)
- ✅ Update limited fields (email, phoneNumber, address)
- ❌ Cannot create or delete schools
- ❌ Cannot change representative assignments

#### Other Roles (Technician)
- ❌ No access to school management

### 5. Frontend Features

#### School Management Page (`/dashboard/schools`)
- **Statistics Dashboard**
  - Total schools
  - Count by category (TSS, VTC, Other)
  - Count by status (Active, Inactive)
  - Representative assignment status

- **Search & Filtering**
  - Search by school code or name
  - Filter by category
  - Filter by status
  - Filter by province

- **School List**
  - Paginated table view
  - Display code, name, category, location, representative, status
  - Edit and delete actions

- **Add School Modal**
  - Complete form with all fields
  - Representative selection (users with 'school' role)
  - Province dropdown (Rwanda's 5 provinces)
  - Status selection

- **Edit School Modal**
  - Update all school information
  - Change representative
  - Update status

- **Delete Confirmation Modal**
  - Type "DELETE" to confirm
  - Prevents accidental deletions

- **Bulk Import Modal**
  - JSON array input
  - Example template provided
  - Success/failure reporting
  - Detailed error messages

### 6. Navigation
Schools link appears in the dashboard navigation only for:
- Admin users
- RTB-Staff users

## Testing the System

### 1. Start Backend
```bash
cd rtb-backend
npm run dev
```
Server runs on: http://localhost:5000
Swagger UI: http://localhost:5000/api-docs

### 2. Start Frontend
```bash
cd rtb-frontend
npm run dev
```
Application runs on: http://localhost:3000

### 3. Test Scenarios

#### Create Single School
1. Login as admin
2. Navigate to Schools page
3. Click "Add School"
4. Fill in required fields:
   - School Code: TSS001
   - School Name: Kigali Technical School
   - Category: TSS
   - Province: Kigali
   - District: Gasabo
   - Sector: Remera
5. Optionally assign representative
6. Submit

#### Bulk Import Schools
1. Click "Bulk Import"
2. Paste JSON array:
```json
[
  {
    "schoolCode": "TSS002",
    "schoolName": "Northern Technical School",
    "category": "TSS",
    "province": "Northern",
    "district": "Musanze",
    "sector": "Muhoza",
    "status": "Active"
  },
  {
    "schoolCode": "VTC001",
    "schoolName": "Eastern VTC",
    "category": "VTC",
    "province": "Eastern",
    "district": "Rwamagana",
    "sector": "Rubona",
    "status": "Active"
  }
]
```
3. Submit and review results

#### Test Role-Based Access
1. Create a user with 'school' role
2. Assign them as representative to a school
3. Login as that user
4. Verify they only see their assigned school
5. Try to edit - confirm limited fields
6. Try to delete - confirm access denied

#### Test Representative Deletion
1. Delete a user who is a representative
2. Verify school's representativeId is set to NULL
3. Confirm school remains in database

## Database Migrations

The School entity is automatically synchronized with the database through TypeORM's `synchronize: true` option in development.

For production, generate migrations:
```bash
npm run typeorm migration:generate -- -n CreateSchoolTable
npm run typeorm migration:run
```

## API Documentation

Full API documentation with request/response examples and schemas is available at:
http://localhost:5000/api-docs

Look for the "Schools" section with all endpoints documented using OpenAPI 3.0 specification.

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Role-based middleware enforces access control
3. **Validation**: class-validator ensures data integrity
4. **XSS Protection**: Input sanitization on all text fields
5. **SQL Injection**: TypeORM parameterized queries prevent injection
6. **Cascade Deletion**: SET NULL prevents data loss on user deletion

## Performance

- **Pagination**: 10 items per page (configurable)
- **Indexing**: Unique index on schoolCode for fast lookups
- **Query Optimization**: Uses TypeORM QueryBuilder for efficient queries
- **Caching**: Statistics cached for 5 minutes (optional enhancement)

## Future Enhancements

1. **Device Assignment**: Link devices to schools
2. **School Reports**: Generate PDF reports for schools
3. **Export Functionality**: Export school data to CSV/Excel
4. **School Hierarchy**: Support for branches or campuses
5. **Contact History**: Track communication with schools
6. **Asset Tracking**: Monitor devices assigned to each school
7. **Performance Metrics**: Track school engagement and asset usage
