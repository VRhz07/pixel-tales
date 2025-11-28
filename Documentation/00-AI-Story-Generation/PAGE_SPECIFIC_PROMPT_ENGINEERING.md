# Page-Specific Prompt Engineering Guide

## 🎯 **Enhanced Scenario-Based Generation**

I've completely redesigned the prompt engineering to create **page-specific scenarios** that will give you the best visual storytelling for each page position in your stories.

---

## 📖 **Page-by-Page Scenario Breakdown**

### **Page 1: Introduction/Establishing Shot**
```typescript
sceneType: 'ESTABLISHING SCENE INTRODUCTION'
environmentFocus: 'DETAILED WORLD BUILDING ENVIRONMENT'
cameraInstruction: 'WIDE ESTABLISHING SHOT, character small in vast environment'
compositionRules: 'character in lower third, environment dominates frame, rule of thirds'
lightingStyle: 'welcoming bright natural lighting, inviting atmosphere'
characterAction: 'character entering scene, beginning journey, looking ahead into environment'
```

**What You'll Get:**
- ✅ **Wide shot** showing the entire world/setting
- ✅ **Character small** in frame to emphasize environment
- ✅ **Welcoming atmosphere** to draw readers in
- ✅ **Character looking ahead** (not at camera) showing journey beginning

---

### **Early Pages (Pages 2-3 in 5-page story, 2-6 in 20-page story)**
```typescript
sceneType: 'WORLD EXPLORATION SCENE'
environmentFocus: 'RICH DETAILED ENVIRONMENT FOR EXPLORATION'
cameraInstruction: 'MEDIUM WIDE SHOT, character discovering environment'
compositionRules: 'character off-center, interacting with environment elements'
lightingStyle: 'clear natural lighting, good visibility for exploration'
characterAction: 'character exploring, investigating, interacting with environment objects'
```

**What You'll Get:**
- ✅ **Character exploring** and interacting with world
- ✅ **Rich environmental details** for world-building
- ✅ **Clear lighting** so readers can see everything
- ✅ **Character off-center** creating dynamic composition

---

### **Rising Action (30-60% through story)**
```typescript
sceneType: 'DYNAMIC ACTION SCENE'
environmentFocus: 'ENVIRONMENT IN MOTION, DYNAMIC SETTING'
cameraInstruction: 'DYNAMIC ANGLE SHOT, character in motion through environment'
compositionRules: 'diagonal composition, character moving through frame, motion lines'
lightingStyle: 'dramatic directional lighting, shadows and highlights for movement'
characterAction: 'character running, chasing, moving with purpose through environment'
```

**What You'll Get:**
- ✅ **Dynamic movement** and energy
- ✅ **Diagonal composition** for visual excitement
- ✅ **Motion blur** and movement lines
- ✅ **Character in action** (running, chasing, moving)

---

### **Emotional Peak (60-85% through story)**
```typescript
sceneType: 'EMOTIONAL DRAMATIC SCENE'
environmentFocus: 'ENVIRONMENT REFLECTING EMOTIONAL STATE'
cameraInstruction: 'MEDIUM DRAMATIC SHOT, character and environment in emotional harmony'
compositionRules: 'character positioned for emotional impact, environment supports mood'
lightingStyle: 'dramatic mood lighting, strong contrasts, emotional atmosphere'
characterAction: 'character showing strong emotion, reacting to environment, pivotal moment'
```

**What You'll Get:**
- ✅ **Emotional character moments** with environmental support
- ✅ **Mood lighting** that matches the emotion
- ✅ **Environment reflects feelings** (stormy for sad, bright for happy)
- ✅ **Character reacting** to story events

---

### **Climax (85-95% through story)**
```typescript
sceneType: 'CLIMACTIC DRAMATIC SCENE'
environmentFocus: 'DRAMATIC POWERFUL ENVIRONMENT'
cameraInstruction: 'DRAMATIC LOW ANGLE or BIRD\'S EYE VIEW, powerful perspective'
compositionRules: 'strong diagonal lines, character in powerful position, dramatic framing'
lightingStyle: 'intense dramatic lighting, strong shadows, peak visual impact'
characterAction: 'character in climactic action, overcoming challenge, moment of triumph'
```

**What You'll Get:**
- ✅ **Dramatic camera angles** (low angle, bird's eye view)
- ✅ **Powerful character positioning** showing triumph
- ✅ **Intense lighting** with strong shadows
- ✅ **Peak visual impact** for story climax

---

### **Final Page: Resolution**
```typescript
sceneType: 'PEACEFUL RESOLUTION SCENE'
environmentFocus: 'SERENE HARMONIOUS ENVIRONMENT'
cameraInstruction: 'WIDE PEACEFUL SHOT, character content in beautiful setting'
compositionRules: 'character small and peaceful, lots of negative space, balanced composition'
lightingStyle: 'soft golden hour lighting, peaceful sunset/sunrise glow'
characterAction: 'character at rest, satisfied, enjoying peaceful moment in environment'
```

**What You'll Get:**
- ✅ **Peaceful wide shot** showing resolution
- ✅ **Golden hour lighting** for warmth and closure
- ✅ **Character at rest** showing journey's end
- ✅ **Lots of negative space** for calm, reflective mood

---

## 🎨 **How the Enhanced System Works**

### **1. Page Position Detection**
```typescript
const position = pageNumber / totalPages;
// Automatically determines story position (0.0 to 1.0)
```

### **2. Scenario Selection**
- **0-30%**: World building and exploration
- **30-60%**: Rising action and movement  
- **60-85%**: Emotional peaks and character development
- **85-95%**: Climactic drama and resolution
- **95-100%**: Peaceful endings and closure

### **3. Prompt Construction**
Each prompt now includes:
- ✅ **Page-specific scene type**
- ✅ **Environment focus** for that story moment
- ✅ **Camera instruction** optimized for narrative purpose
- ✅ **Composition rules** for visual flow
- ✅ **Lighting style** matching story emotion
- ✅ **Character action** appropriate for story beat

---

## 📊 **Example Prompt Comparison**

### **Before (Generic):**
```
CARTOON ILLUSTRATION STYLE, character in forest, wide shot, environmental storytelling, NOT PORTRAIT
```

### **After (Page 1 - Introduction):**
```
SCENE ILLUSTRATION, ENVIRONMENTAL STORYTELLING, ESTABLISHING SCENE INTRODUCTION, DETAILED WORLD BUILDING ENVIRONMENT, WIDE ESTABLISHING SHOT character small in vast environment, FULL SCENE CONTEXT, STORYBOOK SCENE. CARTOON SCENE ILLUSTRATION Disney Pixar movie scene style animated environment character in cartoon world setting colorful cartoon background. WIDE ESTABLISHING SHOT, character small in vast environment showing: character in forest. DETAILED WORLD BUILDING ENVIRONMENT, character in lower third environment dominates frame rule of thirds, detailed environmental storytelling, rich background context, atmospheric depth. welcoming bright natural lighting inviting atmosphere. character entering scene beginning journey looking ahead into environment, character not looking at camera, character naturally positioned in scene, character engaged with environment. professional children's book illustration high quality storybook art safe for children age-appropriate content colorful friendly illustration. IMPORTANT: NO PORTRAIT, NO HEADSHOT, NO CLOSE-UP FACE, NO CHARACTER LOOKING AT CAMERA, NO CENTERED CHARACTER, NO STUDIO PHOTO, NO MUGSHOT, NO SELFIE, NOT A PORTRAIT
```

### **After (Page 4 - Climax):**
```
SCENE ILLUSTRATION, ENVIRONMENTAL STORYTELLING, CLIMACTIC DRAMATIC SCENE, DRAMATIC POWERFUL ENVIRONMENT, DRAMATIC LOW ANGLE or BIRD'S EYE VIEW powerful perspective, FULL SCENE CONTEXT, STORYBOOK SCENE. CARTOON SCENE ILLUSTRATION Disney Pixar movie scene style animated environment character in cartoon world setting colorful cartoon background. DRAMATIC LOW ANGLE or BIRD'S EYE VIEW, powerful perspective showing: character in forest. DRAMATIC POWERFUL ENVIRONMENT, strong diagonal lines character in powerful position dramatic framing, detailed environmental storytelling, rich background context, atmospheric depth. intense dramatic lighting strong shadows peak visual impact. character in climactic action overcoming challenge moment of triumph, character not looking at camera, character naturally positioned in scene, character engaged with environment. professional children's book illustration high quality storybook art safe for children age-appropriate content colorful friendly illustration. IMPORTANT: NO PORTRAIT, NO HEADSHOT, NO CLOSE-UP FACE, NO CHARACTER LOOKING AT CAMERA, NO CENTERED CHARACTER, NO STUDIO PHOTO, NO MUGSHOT, NO SELFIE, NOT A PORTRAIT
```

---

## 🚀 **Expected Results**

### **Visual Storytelling Flow:**
1. **Page 1**: Wide establishing shot introducing the world
2. **Early Pages**: Character exploring and discovering
3. **Middle Pages**: Dynamic action and movement
4. **Emotional Pages**: Character feelings reflected in environment
5. **Climax Pages**: Dramatic angles and powerful moments
6. **Final Page**: Peaceful resolution with golden lighting

### **Composition Variety:**
- ✅ **Wide shots** → **Medium shots** → **Dynamic angles** → **Dramatic perspectives** → **Peaceful wide shots**
- ✅ **Character small** → **Character exploring** → **Character in motion** → **Character triumphant** → **Character at peace**
- ✅ **Bright welcoming** → **Clear exploration** → **Dynamic movement** → **Intense drama** → **Soft golden hour**

### **Environmental Storytelling:**
- ✅ **Environments change** to match story progression
- ✅ **Lighting evolves** from welcoming → clear → dramatic → intense → peaceful
- ✅ **Camera angles vary** based on narrative purpose
- ✅ **Character actions** are always contextual and purposeful

---

## 🧪 **Testing the New System**

### **Generate a 5-Page Story and Check:**

**Page 1 Should Show:**
- Wide shot of character small in environment
- Welcoming, bright lighting
- Character looking ahead into the world (not at camera)
- Rich environmental details

**Page 3 Should Show:**
- Character in dynamic motion
- Diagonal composition with movement
- Dramatic directional lighting
- Environment showing action/movement

**Page 5 Should Show:**
- Peaceful wide shot
- Character content and at rest
- Soft golden hour lighting
- Serene, harmonious environment

---

## 💡 **Pro Tips for Best Results**

### **Story Length Optimization:**
- **5 pages**: Each page gets distinct scenario (intro → explore → action → climax → resolution)
- **10 pages**: More gradual progression with repeated scenarios
- **20 pages**: Extended development in each scenario phase

### **Art Style Considerations:**
- **Cartoon**: Works best with all scenarios, most reliable
- **Watercolor**: Excellent for emotional and peaceful scenes
- **Sketch**: Great for exploration and action scenes
- **Anime**: Perfect for dramatic and climactic moments

### **Mood Enhancement:**
The system now **combines** page scenario with mood:
- **Happy + Climax** = Bright triumphant dramatic scene
- **Sad + Resolution** = Gentle melancholy peaceful scene
- **Exciting + Action** = High-energy dynamic movement scene

---

**The enhanced prompt engineering should now give you cinematic, story-appropriate visuals that flow naturally from page to page, creating a cohesive visual narrative! 🎬✨**
