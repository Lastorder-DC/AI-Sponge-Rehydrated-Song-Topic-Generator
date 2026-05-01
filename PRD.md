# Planning Guide

AI Sponge Rehydrated Song Topic Command Generator - A tool that helps Discord users create properly formatted !topic and !supertopic commands for requesting AI-generated SpongeBob character covers of songs.

**Experience Qualities**:
1. **Playful** - The interface should feel fun and whimsical, evoking the lighthearted nature of SpongeBob SquarePants
2. **Efficient** - Users should be able to quickly generate commands without friction or confusion
3. **Helpful** - Clear guidance and validation to prevent formatting errors that would cause song topics to be skipped

**Complexity Level**: Light Application (multiple features with basic state)
This is a form-based tool with URL parsing, dynamic character management, validation, and clipboard functionality - more than a simple calculator but less complex than a multi-view application.

## Essential Features

### YouTube URL Input and Validation
- **Functionality**: Accepts YouTube URL input and validates format
- **Purpose**: Ensures users provide valid YouTube links and automatically cleans URLs (removes ?si= parameters)
- **Trigger**: User pastes or types YouTube URL into input field
- **Progression**: User inputs URL → System validates → System cleans URL (removes ?si=) → Display cleaned URL preview
- **Success criteria**: URL is properly parsed, ?si= parameter removed, invalid URLs show helpful error message

### Character Selection with Timestamps
- **Functionality**: Add multiple characters with their start times (in seconds)
- **Purpose**: Allows users to create multi-character covers with precise timing
- **Trigger**: User clicks "Add Character" button
- **Progression**: Click add button → Select character from dropdown → Input timestamp (optional for first character) → Character appears in list → Repeat as needed → Remove characters if needed
- **Success criteria**: Users can add, reorder, and remove characters; timestamps are validated as numbers

### Command Generation and Preview
- **Functionality**: Generates properly formatted !topic command in real-time
- **Purpose**: Shows users the exact command they'll copy to Discord
- **Trigger**: Auto-updates as user modifies URL or characters
- **Progression**: User makes changes → Command updates instantly → Visual preview displays formatted command
- **Success criteria**: Command follows exact format: `!topic character1 timestamp1 character2 timestamp2 sings {url}`

### Copy to Clipboard
- **Functionality**: One-click copy of generated command
- **Purpose**: Makes it easy to paste into Discord without manual selection
- **Trigger**: User clicks copy button
- **Progression**: Click copy button → Command copied to clipboard → Toast confirmation appears
- **Success criteria**: Command is copied accurately; user receives visual feedback

### Validation and Error Prevention
- **Functionality**: Real-time validation of all inputs with helpful error messages
- **Purpose**: Prevents incorrectly formatted commands that would be skipped/declined
- **Trigger**: User inputs data
- **Progression**: Input changes → Validation runs → Errors display inline → Copy button disabled until valid
- **Success criteria**: Invalid states clearly communicated; users can't copy invalid commands

## Edge Case Handling
- **Empty URL**: Display clear message prompting user to enter a YouTube URL
- **Invalid URL format**: Show error explaining YouTube URLs must contain youtu.be or youtube.com
- **No characters selected**: Require at least one character before allowing copy
- **Invalid timestamps**: Validate that timestamps are non-negative numbers
- **Duplicate characters at same timestamp**: Allow but show warning that this may be intentional
- **Very long URLs**: Handle without breaking layout
- **Mobile users**: Ensure touch-friendly controls and responsive design

## Design Direction
The design should feel vibrant, oceanic, and playful - channeling the underwater world of Bikini Bottom. Think bubbles, waves, and bright tropical colors that evoke the fun, chaotic energy of SpongeBob while maintaining clarity and usability.

## Color Selection
An oceanic theme with bright, saturated colors that feel energetic and fun.

- **Primary Color**: Deep ocean teal `oklch(0.55 0.12 210)` - Represents the underwater setting, used for primary actions
- **Secondary Colors**: 
  - Sandy yellow `oklch(0.85 0.15 85)` - Evokes SpongeBob himself, used for accents and highlights
  - Coral pink `oklch(0.75 0.14 15)` - Adds warmth and playfulness for secondary elements
- **Accent Color**: Bright bubble cyan `oklch(0.70 0.15 195)` - Eye-catching highlight for CTAs and important interactive elements
- **Foreground/Background Pairings**: 
  - Background (Light ocean blue `oklch(0.97 0.02 220)`): Dark text `oklch(0.25 0.02 240)` - Ratio 11.2:1 ✓
  - Primary (Deep ocean teal `oklch(0.55 0.12 210)`): White text `oklch(0.98 0 0)` - Ratio 5.8:1 ✓
  - Accent (Bright bubble cyan `oklch(0.70 0.15 195)`): Dark text `oklch(0.25 0.02 240)` - Ratio 8.4:1 ✓
  - Card (White `oklch(1 0 0)`): Dark text `oklch(0.25 0.02 240)` - Ratio 13.1:1 ✓

## Font Selection
Typography should feel friendly and approachable while maintaining excellent readability for a technical tool that involves precise command formatting.

- **Primary Font**: Outfit - A rounded geometric sans-serif that feels modern and friendly, perfect for the playful nature of SpongeBob while remaining professional
- **Monospace Font**: JetBrains Mono - For displaying the generated command, ensuring characters and spacing are clearly visible

- **Typographic Hierarchy**: 
  - H1 (App Title): Outfit Bold/32px/tight letter spacing/-0.02em
  - H2 (Section Headers): Outfit SemiBold/20px/normal spacing
  - Body (Instructions): Outfit Regular/16px/1.6 line height
  - Command Preview: JetBrains Mono Medium/15px/1.5 line height
  - Labels: Outfit Medium/14px/normal spacing
  - Helper Text: Outfit Regular/13px/muted color

## Animations
Animations should feel bubbly and fluid, like underwater movement - bouncy and playful without being distracting.

- Bubble-like bounce effects on button presses using spring physics
- Smooth slide-in animations for added characters in the list
- Gentle float animation on the copy button when command is valid (subtle hover state)
- Fade transitions for validation messages
- Satisfying scale + opacity animation when copying to clipboard
- Character rows slide in from right with stagger effect

## Component Selection
- **Components**: 
  - Input (shadcn) - For YouTube URL input with validation states
  - Select (shadcn) - For character dropdown with search functionality
  - Button (shadcn) - Primary actions (add character, copy command) with playful styling
  - Card (shadcn) - Container for the command preview and character list
  - Badge (shadcn) - Display selected characters with timestamps
  - Alert (shadcn) - Show helpful tips and validation errors
  - Label (shadcn) - Form field labels
  - Separator (shadcn) - Visual section division
  - Toast (sonner) - Copy confirmation feedback
  
- **Customizations**: 
  - Custom character list item component with drag handles for reordering
  - Animated background pattern with subtle bubble/wave motifs using CSS gradients
  - Custom command preview box with monospace font and copy button integrated
  - Character counter and timestamp validator components
  
- **States**: 
  - Input: Focus state with teal glow, error state with coral border, success state with subtle check
  - Buttons: Hover with lift effect, pressed with scale down, disabled with reduced opacity
  - Character items: Hover shows remove button, drag state changes opacity
  - Copy button: Default (accent color), hover (slightly brighter), success (green with checkmark)
  
- **Icon Selection**: 
  - Plus (add character)
  - Copy (clipboard action)
  - Check (validation success)
  - X/Trash (remove character)
  - Link (URL input indicator)
  - Music note (for visual flair)
  - Warning (validation errors)
  
- **Spacing**: 
  - Container padding: 6 (24px)
  - Section gaps: 6 (24px)
  - Form field spacing: 4 (16px)
  - Character list item gaps: 2 (8px)
  - Button padding: px-6 py-3
  
- **Mobile**: 
  - Single column layout on mobile
  - Larger touch targets (min 44px)
  - Sticky command preview at bottom on mobile
  - Character dropdown becomes full-screen on mobile
  - Reduced padding/spacing for compact mobile view
  - Stack form elements vertically below 640px
