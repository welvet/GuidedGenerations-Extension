# Profile System Implementation

## Overview
This document describes the implementation of a dual-dropdown system for Connection Profiles and Presets in the Guided Generations Extension. The system allows users to select both a Connection Profile and a Preset for each guide, with automatic profile switching when guides are executed.

## Key Features

### 1. Dual Dropdown System
- **Profile Dropdown**: Allows selection of a specific Connection Profile or "Current Profile" (default)
- **Preset Dropdown**: Shows presets available for the selected profile
- Each guide now has both profile and preset selection

### 2. Profile Management
- **Current Profile Detection**: Automatically detects the currently active Connection Profile
- **Profile Switching**: Temporarily switches to selected profiles when guides run
- **Profile Restoration**: Automatically restores the original profile after guide execution
- **Profile List**: Dynamically populates profile dropdowns with available Connection Profiles

### 3. Preset Management
- **Profile-Dependent Presets**: Preset lists are populated based on the selected profile
- **Automatic Population**: Preset dropdowns automatically update when profile selection changes
- **Backward Compatibility**: Existing preset-only configurations continue to work

### 4. Smart Profile Handling
- **No Profile Selected**: Uses current profile, no switching occurs
- **Profile Selected**: Switches to profile before running guide, restores after completion
- **Error Handling**: Gracefully handles profile switching failures

## Implementation Details

### New Files Created
1. **`scripts/utils/profileUtils.js`** - Core profile management functions
2. **`test-profile-system.html`** - Test interface for the profile system

### Modified Files
1. **`index.js`** - Added profile settings, migration logic, and UI handling
2. **`scripts/utils/presetUtils.js`** - Enhanced to handle both profile and preset switching
3. **`settings.html`** - Updated UI to include profile dropdowns
4. **`scripts/guidedImpersonate.js`** - Updated to use new profile+preset system (example)

### Core Functions

#### Profile Management (`profileUtils.js`)
- `getCurrentProfile()` - Gets the currently active Connection Profile
- `getProfileList()` - Retrieves list of all available Connection Profiles
- `switchToProfile(profileName)` - Switches to a specific profile
- `withProfile(profileName, operation)` - Executes operation with temporary profile switch

#### Enhanced Preset Management (`presetUtils.js`)
- `handleProfileAndPresetSwitching(profileValue, presetValue)` - Handles both profile and preset switching
- Maintains backward compatibility with existing preset-only system

#### Settings Management (`index.js`)
- `migrateProfileSettings()` - Automatically migrates existing settings to include profile fields
- `handleProfileChangeForPresets()` - Repopulates preset dropdowns when profile changes
- `populatePresetDropdown()` - Populates preset dropdowns with current profile's presets

### Data Structure Changes

#### New Settings Fields
Each guide now has two settings:
```javascript
profileClothes: '',        // Connection Profile for Clothes Guide
presetClothes: '',         // Preset for Clothes Guide
profileState: '',          // Connection Profile for State Guide
presetState: '',           // Preset for State Guide
// ... and so on for all guides
```

#### Backward Compatibility
- Existing preset-only configurations automatically get profile fields set to empty string
- Empty profile string means "use current profile"
- No breaking changes to existing functionality

### UI Changes

#### Settings Panel
- Each guide now shows two dropdowns:
  1. **Profile Dropdown**: Connection Profile selection
  2. **Preset Dropdown**: Preset selection for the chosen profile
- Profile dropdown includes "Current Profile" option
- Preset dropdowns automatically update when profile selection changes

#### Dynamic Population
- Profile dropdowns populated with available Connection Profiles from STScript `/profile-list`
- Preset dropdowns populated based on selected profile
- Automatic refresh when profile selection changes

## Usage Examples

### Basic Usage
1. **Select Profile**: Choose a Connection Profile from the dropdown (or leave as "Current Profile")
2. **Select Preset**: Choose a preset from the dropdown (presets are profile-specific)
3. **Run Guide**: The system automatically switches to the selected profile, runs the guide, then restores the original profile

### Advanced Usage
- **Profile-Specific Presets**: Different profiles may have different preset options
- **Mixed Configuration**: Some guides can use current profile, others can use specific profiles
- **Dynamic Switching**: Profile switching happens automatically without user intervention

## Technical Implementation

### STScript Integration
- Uses `/profile` command to get current profile and switch profiles
- Uses `/profile-list` command to get available profiles
- All profile operations use `executeSlashCommandsWithOptions` for consistency

### Error Handling
- Graceful fallback to current profile if profile switching fails
- Automatic profile restoration even if guide execution fails
- Comprehensive logging for debugging

### Performance Considerations
- Profile switching only occurs when necessary
- Preset lists cached and updated on-demand
- Minimal overhead for guides using current profile

## Migration Guide

### For Existing Users
1. **Automatic Migration**: Profile fields automatically added to existing settings
2. **No Action Required**: Existing functionality continues to work unchanged
3. **Optional Enhancement**: Can now select specific profiles for guides if desired

### For New Users
1. **Profile Selection**: Choose Connection Profiles for guides that need specific profiles
2. **Preset Selection**: Select presets from the profile-specific preset lists
3. **Current Profile**: Leave profile as "Current Profile" to use the active profile

## Testing

### Test File
- `test-profile-system.html` provides a basic testing interface
- Tests profile management functions independently
- Requires SillyTavern context for full functionality testing

### Manual Testing
1. **Settings Panel**: Verify profile and preset dropdowns populate correctly
2. **Profile Switching**: Test profile selection and preset population
3. **Guide Execution**: Verify profile switching during guide execution
4. **Profile Restoration**: Confirm original profile is restored after guide completion

## Future Enhancements

### Potential Improvements
1. **Profile Groups**: Group related profiles for easier management
2. **Profile Templates**: Save common profile+preset combinations
3. **Bulk Operations**: Apply profile changes to multiple guides at once
4. **Profile Validation**: Verify profile availability before allowing selection

### Integration Opportunities
1. **Character-Specific Profiles**: Different profiles for different character types
2. **Context-Aware Switching**: Automatic profile selection based on context
3. **Profile Performance Metrics**: Track which profiles work best for different guides

## Troubleshooting

### Common Issues
1. **Profile Not Found**: Verify profile exists in Connection Profiles
2. **Preset List Empty**: Check if profile has presets available
3. **Profile Switch Fails**: Ensure STScript commands are available
4. **Settings Not Saving**: Check browser console for errors

### Debug Mode
- Enable debug mode in extension settings for detailed logging
- Profile operations logged with `debugLog` for troubleshooting
- Error conditions logged with `console.error` for user visibility

## Conclusion

The Profile System implementation provides a robust, backward-compatible solution for managing Connection Profiles and Presets in the Guided Generations Extension. It enhances the user experience by allowing fine-grained control over which profiles and presets are used for different guides, while maintaining the simplicity of the existing system for users who prefer to use the current profile.

