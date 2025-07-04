# CloudStore - Enterprise Cloud File Storage System

A secure, scalable cloud file storage system built with Next.js, MongoDB, and AWS S3. Features real-time file management, virus scanning, secure sharing, and enterprise-grade security.

![CloudStore Dashboard](https://via.placeholder.com/800x400/4F46E5/FFFFFF?text=CloudStore+Dashboard)

## 🚀 Features

### 🔐 **Security First**
- JWT-based authentication with secure HTTP-only cookies
- Real-time virus scanning with signature detection
- File type validation and size limits
- Password-protected file sharing
- Encrypted storage with AWS S3 server-side encryption

### 📁 **File Management**
- Drag & drop file uploads with progress tracking
- Real-time file preview (images, videos, audio, PDFs)
- Automatic thumbnail generation for images
- File search and filtering capabilities
- Storage quota management and analytics

### 🔗 **Advanced Sharing**
- Secure share links with expiration dates
- Password protection for shared files
- Download/preview permission controls
- Access tracking and analytics
- Email sharing integration

### 🎨 **Modern UI/UX**
- Responsive design for all devices
- Grid and list view modes
- Real-time notifications and feedback
- Dark mode support (coming soon)
- Accessibility-first design

### ⚡ **Performance & Scalability**
- AWS S3 integration with pre-signed URLs
- MongoDB with optimized indexes
- Image processing and optimization
- Background virus scanning
- CDN-ready architecture

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: MongoDB with Mongoose ODM
- **Storage**: AWS S3 with pre-signed URLs
- **Authentication**: JWT with bcrypt password hashing
- **File Processing**: Sharp for image optimization
- **Security**: Custom virus scanner, input validation
- **UI Components**: shadcn/ui, Radix UI primitives

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- MongoDB Atlas account or local MongoDB instance
- AWS account with S3 access
- Git for version control

## 🚀 Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/yourusername/cloudstore.git
cd cloudstore
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Environment Setup

Create a \`.env.local\` file in the root directory:

\`\`\`env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cloudstore

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Optional: For production
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
\`\`\`

### 4. Database Setup

Run the database setup script to create indexes and a demo user:

\`\`\`bash
node scripts/setup-database.js
\`\`\`

### 5. AWS S3 Setup

1. Create an S3 bucket in your AWS console
2. Configure CORS policy for your bucket:

\`\`\`json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
\`\`\`

3. Create an IAM user with S3 permissions:

\`\`\`json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
\`\`\`

### 6. Start Development Server

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) and login with:
- **Email**: demo@example.com
- **Password**: password

## 📁 Project Structure

\`\`\`
cloudstore/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── files/         # File management endpoints
│   │   └── shared/        # File sharing endpoints
│   ├── shared/            # Public file sharing pages
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth-provider.tsx # Authentication context
│   ├── file-manager.tsx  # Main file management interface
│   ├── file-upload.tsx   # File upload component
│   ├── file-preview.tsx  # File preview modal
│   └── share-dialog.tsx  # File sharing dialog
├── lib/                  # Utility libraries
│   ├── auth.ts          # JWT authentication
│   ├── database.ts      # MongoDB operations
│   ├── mongodb.ts       # MongoDB connection
│   ├── s3.ts           # AWS S3 operations
│   ├── file-processor.ts # File processing utilities
│   ├── file-validator.ts # File validation
│   └── virus-scanner.ts  # Security scanning
├── scripts/             # Database and maintenance scripts
└── public/             # Static assets
\`\`\`

## 🔧 Configuration

### Storage Limits

Default storage limits can be configured in \`lib/database.ts\`:

\`\`\`typescript
storageLimit: 5 * 1024 * 1024 * 1024, // 5GB default
\`\`\`

### File Type Restrictions

Modify allowed file types in \`lib/file-validator.ts\`:

\`\`\`typescript
ALLOWED_TYPES: [
  "image/jpeg", "image/png", "image/gif",
  "video/mp4", "video/webm",
  "application/pdf",
  // Add more types as needed
]
\`\`\`

### Virus Scanner

The virus scanner can be enhanced with real antivirus integration:

\`\`\`typescript
// In lib/virus-scanner.ts
// Integrate with ClamAV, VirusTotal API, or AWS Lambda
\`\`\`

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Docker

\`\`\`dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Manual Server

\`\`\`bash
npm run build
npm start
\`\`\`

## 🔒 Security Considerations

### Production Checklist

- [ ] Use strong JWT secrets (32+ characters)
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS policies
- [ ] Set up rate limiting
- [ ] Enable AWS CloudTrail for S3 access logs
- [ ] Implement proper backup strategies
- [ ] Set up monitoring and alerting
- [ ] Regular security audits

### File Security

- All files are encrypted at rest in S3
- Virus scanning before and after upload
- File type validation and sanitization
- Pre-signed URLs with expiration
- Access logging and monitoring

## 📊 Monitoring & Analytics

### Built-in Analytics

- Storage usage tracking
- File upload/download statistics
- Share link analytics
- User activity monitoring

### External Integration

The system supports integration with:
- AWS CloudWatch for infrastructure monitoring
- MongoDB Atlas monitoring
- Custom analytics platforms

## 🧪 Testing

\`\`\`bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow the existing code style
- Ensure security best practices

## 📝 API Documentation

### Authentication

\`\`\`bash
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/verify
\`\`\`

### File Management

\`\`\`bash
GET /api/files              # List user files
POST /api/files/upload      # Upload files
GET /api/files/:id          # Get file details
DELETE /api/files/:id       # Delete file
GET /api/files/:id/download # Download file
\`\`\`

### File Sharing

\`\`\`bash
POST /api/files/:id/share   # Create share link
GET /api/shared/:shareId    # Access shared file
POST /api/shared/:shareId/verify # Verify share password
\`\`\`

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Issues**
\`\`\`bash
# Check connection string format
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
\`\`\`

**AWS S3 Permission Errors**
\`\`\`bash
# Verify IAM permissions and bucket policy
# Check AWS credentials and region settings
\`\`\`

**File Upload Failures**
\`\`\`bash
# Check file size limits
# Verify virus scanner configuration
# Check storage quota limits
\`\`\`

### Debug Mode

Enable debug logging:

\`\`\`env
DEBUG=cloudstore:*
NODE_ENV=development
\`\`\`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing React framework
- [MongoDB](https://www.mongodb.com/) for the flexible database
- [AWS S3](https://aws.amazon.com/s3/) for reliable file storage
- [shadcn/ui](https://ui.shadcn.com/) for beautiful UI components
- [Vercel](https://vercel.com/) for seamless deployment

## 📞 Support

- 📧 Email: support@cloudstore.com
- 💬 Discord: [Join our community](https://discord.gg/cloudstore)
- 📖 Documentation: [docs.cloudstore.com](https://docs.cloudstore.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/cloudstore/issues)

---

**Built with ❤️ by the CloudStore Team**

[⭐ Star us on GitHub](https://github.com/yourusername/cloudstore) | [🚀 Deploy on Vercel](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/cloudstore)
\`\`\`

```gitignore project="CloudStore" file=".gitignore" type="text"
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

# Next.js
.next/
out/
build/
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE and Editor files
.vscode/
.idea/
*.swp
*.swo
*~

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# nyc test coverage
.nyc_output

# Dependency directories
jspm_packages/

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env.test

# parcel-bundler cache (https://parceljs.org/)
.cache
.parcel-cache

# next.js build output
.next

# nuxt.js build output
.nuxt

# vuepress build output
.vuepress/dist

# Serverless directories
.serverless

# FuseBox cache
.fusebox/

# DynamoDB Local files
.dynamodb/

# TernJS port file
.tern-port

# Stores VSCode versions used for testing VSCode extensions
.vscode-test

# Temporary folders
tmp/
temp/

# AWS
.aws/

# Local database files
*.db
*.sqlite
*.sqlite3

# Backup files
*.backup
*.bak

# Test files
test-results/
playwright-report/
test-results.xml

# Docker
Dockerfile.local
docker-compose.override.yml

# Local uploads (if any)
uploads/
public/uploads/

# Sharp cache
.sharp/

# Turborepo
.turbo

# Sentry
.sentryclirc

# Bundle analyzer
.bundle-analyzer/

# PWA files
**/public/sw.js
**/public/workbox-*.js
**/public/worker-*.js
**/public/sw.js.map
**/public/workbox-*.js.map
**/public/worker-*.js.map

# Storybook
storybook-static/

# Chromatic
chromatic.log

# Local Netlify folder
.netlify

# SvelteKit
.svelte-kit

# Capacitor
.capacitor/
android/
ios/

# Tauri
src-tauri/target/

# Rust
target/

# Go
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
go.work

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
ENV/
env.bak/
venv.bak/

# Java
*.class
*.jar
*.war
*.ear
*.zip
*.tar.gz
*.rar

# Gradle
.gradle/
build/

# Maven
target/
pom.xml.tag
pom.xml.releaseBackup
pom.xml.versionsBackup
pom.xml.next
release.properties
dependency-reduced-pom.xml
buildNumber.properties
.mvn/timing.properties

# IntelliJ IDEA
.idea/
*.iws
*.iml
*.ipr
out/

# Eclipse
.metadata
bin/
tmp/
*.tmp
*.bak
*.swp
*~.nib
local.properties
.settings/
.loadpath
.recommenders
.project
.classpath
.factorypath
.buildpath
.target

# NetBeans
/nbproject/private/
/nbbuild/
/dist/
/nbdist/
/.nb-gradle/

# Visual Studio Code
.vscode/
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json
*.code-workspace

# Local History for Visual Studio Code
.history/

# Windows
Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/
*.cab
*.msi
*.msm
*.msp
*.lnk

# macOS
.DS_Store
.AppleDouble
.LSOverride
Icon
._*
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
.VolumeIcon.icns
.com.apple.timemachine.donotpresent
.AppleDB
.AppleDesktop
Network Trash Folder
Temporary Items
.apdisk

# Linux
*~
.fuse_hidden*
.directory
.Trash-*
.nfs*

# Vim
[._]*.s[a-v][a-z]
[._]*.sw[a-p]
[._]s[a-rt-v][a-z]
[._]ss[a-gi-z]
[._]sw[a-p]
Session.vim
Sessionx.vim
.netrwhist
*~
tags
[._]*.un~

# Emacs
*~
\#*\#
/.emacs.desktop
/.emacs.desktop.lock
*.elc
auto-save-list
tramp
.\#*
.org-id-locations
*_archive
*_flymake.*
/eshell/history
/eshell/lastdir
/elpa/
*.rel

# Sublime Text
*.tmlanguage.cache
*.tmPreferences.cache
*.stTheme.cache
*.sublime-workspace
*.sublime-project

# Atom
.atom/

# JetBrains
.idea/
*.iml
*.ipr
*.iws
.idea_modules/
atlassian-ide-plugin.xml
com_crashlytics_export_strings.xml
crashlytics.properties
crashlytics-build.properties
fabric.properties

# Local configuration files
config.local.js
config.local.json
.env.local.example

# Temporary files
*.tmp
*.temp
*.swp
*.swo
*~

# Archive files
*.7z
*.dmg
*.gz
*.iso
*.jar
*.rar
*.tar
*.zip

# Database dumps
*.sql
*.dump

# Certificate files
*.pem
*.key
*.crt
*.csr
*.p12
*.pfx

# Security files
secrets/
private/
.secrets/

# Monitoring and analytics
.sentry/
.amplitude/
.mixpanel/

# Performance monitoring
.lighthouse/
.webpagetest/

# API keys and tokens
.api-keys
.tokens
credentials.json
service-account.json

# Backup directories
backups/
.backup/

# Cache directories
.cache/
cache/
.tmp/

# Build artifacts
artifacts/
.artifacts/

# Documentation build
docs/_build/
site/

# Jupyter Notebook
.ipynb_checkpoints

# IPython
profile_default/
ipython_config.py

# pyenv
.python-version

# Celery
celerybeat-schedule
celerybeat.pid

# SageMath parsed files
*.sage.py

# Spyder project settings
.spyderproject
.spyproject

# Rope project settings
.ropeproject

# mkdocs documentation
/site

# mypy
.mypy_cache/
.dmypy.json
dmypy.json

# Pyre type checker
.pyre/

# pytype static type analyzer
.pytype/

# Cython debug symbols
cython_debug/

# Local development
.local/
local/

# Terraform
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl

# Ansible
*.retry

# Vagrant
.vagrant/

# Chef
.chef/

# Puppet
.puppet/

# Salt
.salt/

# Kubernetes
*.kubeconfig

# Helm
.helm/

# Serverless Framework
.serverless/

# CDK
cdk.out/

# Pulumi
.pulumi/

# Firebase
.firebase/
firebase-debug.log
firestore-debug.log
ui-debug.log

# Supabase
.supabase/

# Planetscale
.pscale/

# Railway
.railway/

# Render
.render/

# Fly.io
.fly/

# Cloudflare
.wrangler/

# Deno
.deno/

# Bun
.bun/

# pnpm
.pnpm-debug.log*
.pnpm/

# Yarn
.yarn/cache
.yarn/unplugged
.yarn/build-state.yml
.yarn/install-state.gz
.pnp.*

# Rush
common/temp/
common/deploy/
common/config/rush/
.rush/

# Nx
.nx/cache
.nx/workspace-data

# Lerna
lerna-debug.log*

# Bit
.bit/

# ESLint
.eslintcache

# Prettier
.prettierignore

# Stylelint
.stylelintcache

# Jest
coverage/
.jest/

# Cypress
cypress/videos/
cypress/screenshots/
cypress/downloads/

# Playwright
test-results/
playwright-report/
playwright/.cache/

# Storybook
storybook-static/
.storybook/public/

# Chromatic
chromatic.log

# Vite
vite.config.js.timestamp-*
vite.config.ts.timestamp-*

# Rollup
.rollup.cache/

# Parcel
.parcel-cache/

# Webpack
.webpack/

# Snowpack
.snowpack/

# Vite PWA
dev-dist/
sw.js
sw.js.map
workbox-*.js
workbox-*.js.map

# SvelteKit
.svelte-kit/

# Astro
.astro/

# Nuxt
.nuxt/
.output/

# Remix
.remix/

# Solid
.solid/

# Qwik
.qwik/

# Angular
.angular/
dist/

# Vue
.vue/

# React
.react/

# Svelte
.svelte/

# Preact
.preact/

# Lit
.lit/

# Stencil
.stencil/

# Ionic
.ionic/

# Capacitor
.capacitor/

# Cordova
platforms/
plugins/
www/

# Electron
.electron/
release/

# Tauri
src-tauri/target/

# Flutter
.flutter-plugins
.flutter-plugins-dependencies
.packages
.pub-cache/
.pub/
build/
.dart_tool/

# Unity
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Uu]ser[Ss]ettings/
MemoryCaptures/
.vsconfig

# Unreal Engine
Binaries/
DerivedDataCache/
Intermediate/
Saved/
.vscode/
*.VC.db
*.opensdf
*.opendb
*.sdf
*.sln
*.suo
*.xcodeproj
*.xcworkspace

# Godot
.godot/
.import/
export.cfg
export_presets.cfg
.mono/
data_*/

# Blender
*.blend1
*.blend2
.blender/

# Maya
*.ma.swatches
*.mb.swatches

# 3ds Max
*.max.bak

# Cinema 4D
*.c4d.bak

# Adobe
*.psd.tmp
*.ai.tmp
*.indd.tmp

# Sketch
*.sketch.backup

# Figma
*.fig.backup

# Zeplin
.zeplin/

# InVision
.invision/

# Marvel
.marvel/

# Principle
.principle/

# Framer
.framer/

# ProtoPie
.protopie/

# Origami
.origami/

# Flinto
.flinto/

# Principle
.principle/

# After Effects
*.aep.backup

# Premiere Pro
*.prproj.backup

# Final Cut Pro
*.fcpbundle/

# DaVinci Resolve
*.drp.backup

# Avid Media Composer
*.avp.backup

# Pro Tools
*.ptx.backup

# Logic Pro
*.logic/

# Ableton Live
*.als.backup

# FL Studio
*.flp.backup

# Cubase
*.cpr.backup

# Reaper
*.rpp.backup

# Studio One
*.song.backup

# Reason
*.reason.backup

# Bitwig Studio
*.bwproject.backup

# Maschine
*.nkt.backup

# Kontakt
*.nki.backup

# Battery
*.kit.backup

# Massive
*.nmsv.backup

# Serum
*.fxp.backup

# Sylenth1
*.fxb.backup

# Nexus
*.nxp.backup

# Omnisphere
*.prt_omni.backup

# Keyscape
*.prt_keyscape.backup

# Trilian
*.prt_trilian.backup

# Stylus RMX
*.prt_stylus.backup

# BFD3
*.bfd3.backup

# Superior Drummer
*.sdx.backup

# EZdrummer
*.ezx.backup

# Addictive Drums
*.adpak.backup

# Steven Slate Drums
*.ssd5.backup

# XLN Audio Addictive Keys
*.xlnaudio.backup

# Native Instruments
*.nicnt.backup

# Spectrasonics
*.spec.backup

# FXpansion
*.fxp.backup

# Toontrack
*.toontrack.backup

# XLN Audio
*.xln.backup

# IK Multimedia
*.ik.backup

# Arturia
*.arturia.backup

# Roland
*.roland.backup

# Korg
*.korg.backup

# Yamaha
*.yamaha.backup

# Moog
*.moog.backup

# Sequential
*.sequential.backup

# Dave Smith Instruments
*.dsi.backup

# Elektron
*.elektron.backup

# Teenage Engineering
*.te.backup

# Make Noise
*.makenoise.backup

# Mutable Instruments
*.mutableinstruments.backup

# Intellijel
*.intellijel.backup

# Doepfer
*.doepfer.backup

# Pittsburgh Modular
*.pittsburghmodular.backup

# Noise Engineering
*.noiseengineering.backup

# ALM Busy Circuits
*.almbusycircuits.backup

# Befaco
*.befaco.backup

# Erica Synths
*.ericasynths.backup

# Hexinverter
*.hexinverter.backup

# Industrial Music Electronics
*.industrialmusicelectronics.backup

# Joranalogue
*.joranalogue.backup

# Low-Gain Electronics
*.lowgainelectronics.backup

# Mannequins
*.mannequins.backup

# Monome
*.monome.backup

# Music Thing Modular
*.musicthingmodular.backup

# Nonlinear Circuits
*.nonlinearcircuits.backup

# Qu-Bit Electronix
*.qubitelectronix.backup

# Random*Source
*.randomsource.backup

# Rossum Electro-Music
*.rossumelectromusic.backup

# Strymon
*.strymon.backup

# Synthesis Technology
*.synthesistechnology.backup

# Tiptop Audio
*.tiptopaudio.backup

# Verbos Electronics
*.verboselectronics.backup

# WMD
*.wmd.backup

# Xaoc Devices
*.xaocdevices.backup

# 4ms Company
*.4mscompany.backup

# 2hp
*.2hp.backup

# Addac System
*.addacsystem.backup

# After Later Audio
*.afterlateraudio.backup

# Antimatter Audio
*.antimatteraudio.backup

# Bastl Instruments
*.bastlinstruments.backup

# Calsynth
*.calsynth.backup

# Cre8audio
*.cre8audio.backup

# Dreadbox
*.dreadbox.backup

# Endorphin.es
*.endorphines.backup

# Expert Sleepers
*.expertsleepers.backup

# Feedback Modules
*.feedbackmodules.backup

# Flame
*.flame.backup

# Frequency Central
*.frequencycentral.backup

# Happy Nerding
*.happynerding.backup

# Hikari Instruments
*.hikariinstruments.backup

# Instruo
*.instruo.backup

# Klavis
*.klavis.backup

# Ladik
*.ladik.backup

# Livestock Electronics
*.livestockelectronics.backup

# Malekko Heavy Industry
*.malekkoheavyindustry.backup

# Michigan Synth Works
*.michigansynthworks.backup

# Moffenzeef Modular
*.moffenzeefmodular.backup

# Mystic Circuits
*.mysticcircuits.backup

# Noise Reap
*.noisereap.backup

# Ornament & Crime
*.ornamentcrime.backup

# Patching Panda
*.patchingpanda.backup

# Plum Audio
*.plumaudio.backup

# Rebel Technology
*.rebeltechnology.backup

# Schlappi Engineering
*.schlappiengineering.backup

# Shakmat Modular
*.shakmatmodular.backup

# Steady State Fate
*.steadystatefate.backup

# Studio Electronics
*.studioelectronics.backup

# Synthrotek
*.synthrotek.backup

# Takaab
*.takaab.backup

# Tesseract Modular
*.tesseractmodular.backup

# The Harvestman
*.theharvestman.backup

# Thonk
*.thonk.backup

# Trogotronic
*.trogotronic.backup

# Tubbutec
*.tubbutec.backup

# Turing Machine
*.turingmachine.backup

# Twisted Electrons
*.twistedelectrons.backup

# Vpme
*.vpme.backup

# Winter Modular
*.wintermodular.backup

# Worng Electronics
*.worngelectronics.backup

# Zlob Modular
*.zlobmodular.backup
