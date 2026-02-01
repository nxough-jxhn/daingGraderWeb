/**
 * About Us: 3 project members + TUP section.
 *
 * WHERE TO SAVE PROFILE IMAGES:
 *   Put member photos in:  public/assets/team/
 *   Filenames:  member1.jpg, member2.jpg, member3.jpg  (or .png)
 *   Recommended size: 400x400 px or square aspect ratio.
 *
 * WHERE TO CHANGE MEMBER INFO:
 *   Edit the objects below: name, role, bio, age, contactNumber, image path, and social URLs/handles.
 *   For social: set URL (e.g. github) and display handle (e.g. githubHandle '@username') or '' to hide.
 */

export interface TeamMember {
  id: string
  /** Change: full name */
  name: string
  /** Change: role e.g. "Lead Developer", "Researcher" */
  role: string
  /** Change: short bio (1-2 sentences) */
  bio: string
  /** Change: age (number) or leave empty */
  age?: number
  /** Change: contact number string or '' */
  contactNumber?: string
  /** Image path - use /assets/team/member1.jpg if file is public/assets/team/member1.jpg */
  image: string
  /** Change: GitHub profile URL or '' */
  github: string
  /** Change: display e.g. '@username' shown next to GitHub icon */
  githubHandle?: string
  /** Change: Facebook profile URL or '' */
  facebook: string
  /** Change: display e.g. '@username' next to Facebook icon */
  facebookHandle?: string
  /** Change: Instagram profile URL or '' */
  instagram: string
  /** Change: display e.g. '@username' next to Instagram icon */
  instagramHandle?: string
}

export interface TUPInfo {
  /** Change: full institution name */
  name: string
  /** Change: brief description of TUP */
  description: string
  /** Logo path - same location as header: public/assets/logos/tup-t-logo.png */
  logo: string
}

/** Change: update names, roles, bios, age, contactNumber, and social links/handles for each member */
export const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Member One',
    role: 'Role / Position',
    bio: 'Short bio for this team member. Edit in src/data/team.ts.',
    age: undefined,
    contactNumber: '',
    image: '/assets/team/member1.jpg',
    github: '',
    githubHandle: '',
    facebook: '',
    facebookHandle: '',
    instagram: '',
    instagramHandle: '',
  },
  {
    id: '2',
    name: 'Member Two',
    role: 'Role / Position',
    bio: 'Short bio for this team member. Edit in src/data/team.ts.',
    age: undefined,
    contactNumber: '',
    image: '/assets/team/member2.jpg',
    github: '',
    githubHandle: '',
    facebook: '',
    facebookHandle: '',
    instagram: '',
    instagramHandle: '',
  },
  {
    id: '3',
    name: 'Member Three',
    role: 'Role / Position',
    bio: 'Short bio for this team member. Edit in src/data/team.ts.',
    age: undefined,
    contactNumber: '',
    image: '/assets/team/member3.jpg',
    github: '',
    githubHandle: '',
    facebook: '',
    facebookHandle: '',
    instagram: '',
    instagramHandle: '',
  },
]

/** Change: TUP name and description in src/data/team.ts */
export const tupInfo: TUPInfo = {
  name: 'Technological University of the Philippines - Taguig',
  description: 'Brief description of TUP-T. Edit this text in src/data/team.ts.',
  logo: '/assets/logos/tup-t-logo.png',
}
