# Sushma App - User Management System

## Overview

This application includes a comprehensive user management system with role-based access control. Users can sign up with a default "user" role, and administrators can change user roles through the admin panel. When a user's role is changed, the system automatically creates the appropriate role-specific records.

## User Roles

The system supports the following user roles:

- **User**: Regular user with basic access
- **Admin**: Administrator with full access to the admin panel
- **Dealer**: Dealer with access to dealer-specific features
- **Worker**: Worker with access to worker-specific features
- **Salesman**: Salesman with access to salesman-specific features

## Database Structure

The database includes the following tables for user management:

- **profiles**: Stores user profile information and roles
- **dealers**: Stores dealer-specific information
- **workers**: Stores worker-specific information
- **salesmen**: Stores salesman-specific information

## Role Management

When a user signs up, they are assigned the "user" role by default. Administrators can change a user's role through the admin panel. When a user's role is changed, the system automatically creates the appropriate role-specific record.

For example, if an administrator changes a user's role to "dealer", the system will automatically create a record in the dealers table with a unique dealer code.

## Recent Changes

### Fixed Sign-Up Process

- Simplified the sign-up process to only create users with the "user" role
- Fixed toast notifications by using the useToast hook
- Added proper error handling for sign-up failures

### Added Admin Profile Management

- Created a new admin page for managing user profiles
- Administrators can view all users and update their roles
- When a role is changed, the appropriate role-specific record is automatically created

### Updated Database Triggers

- Created a unified function to handle all role changes
- Implemented a single trigger that handles all role changes
- Fixed infinite recursion issues in Row Level Security policies
- Added a security definer function to check if a user is an admin
- Added safety checks to prevent "trigger already exists" errors
- Implemented conditional execution based on table existence

### Fixed Infinite Recursion Error

The application was experiencing an infinite recursion error in the RLS policies. This was fixed by:

1. Creating a `is_admin()` security definer function that safely checks if a user is an admin
2. Replacing recursive policy checks with calls to this function
3. Temporarily disabling RLS while updating policies
4. Adding proper error handling and safety checks

## Row Level Security

The application uses Supabase Row Level Security (RLS) to ensure that users can only access data they are authorized to see:

- Users can only view and update their own profiles
- Administrators can view and update all profiles
- Users can only view their own role-specific records
- Administrators can view and update all role-specific records

## How to Use

1. **Sign Up**: Users can sign up with a default "user" role
2. **Admin Access**: Administrators can access the admin panel at `/admin`
3. **Profile Management**: Administrators can manage user profiles at `/admin/profile`
4. **Role-Specific Pages**: Administrators can view role-specific information at:
   - `/admin/dealer` for dealers
   - `/admin/worker` for workers
   - `/admin/salesman` for salesmen

## Troubleshooting

If you encounter issues with the user management system, check the following:

1. **Database Migrations**: Ensure all migrations have been applied
2. **Row Level Security**: Check RLS policies for any conflicts
3. **Triggers**: Verify that triggers are working correctly
4. **User Roles**: Confirm that users have the correct roles assigned
5. **Infinite Recursion**: If you see an infinite recursion error, check the RLS policies
6. **Trigger Already Exists**: If you see a "trigger already exists" error, run the migration again with the updated code
