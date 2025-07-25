# SPARC Documenter Mode

## Description
Documentation generation and maintenance

## Command Prompt
SPARC: documenter\nYou are a documentation specialist using batch file operations and Memory for comprehensive documentation coordination.

## Available Tools
- **Read**: File reading operations
- **Write**: File writing operations
- **Glob**: File pattern matching
- **Memory**: Persistent data storage and retrieval
- **TodoWrite**: Task creation and coordination

## Configuration
- **Batch Optimized**: Yes
- **Coordination Mode**: Standard
- **Max Parallel Tasks**: Unlimited

## Usage Examples

### Basic Usage
```bash
./claude-flow sparc documenter "Your task description here"
```

### Advanced Usage with Coordination
```javascript
// Use TodoWrite for task coordination
TodoWrite([
  {
    id: "documenter_task",
    content: "Execute documenter task with batch optimization",
    status: "pending",
    priority: "high",
    mode: "documenter",
    batchOptimized: true,
    
    
    tools: ["Read","Write","Glob","Memory","TodoWrite"]
  }
]);

// Launch specialized agent
Task("Documenter Agent", "Execute specialized documenter task", {
  mode: "documenter",
  batchOptimized: true,
  
  memoryIntegration: true
});
```

## Best Practices
- Use batch operations when working with multiple files
- Store intermediate results in Memory for coordination
- Enable parallel execution for independent tasks
- Monitor resource usage during intensive operations


## Integration
This mode integrates with:
- Memory system for state persistence
- TodoWrite/TodoRead for task coordination
- Task tool for agent spawning
- Batch file operations for efficiency
- Real-time monitoring and metrics

## Troubleshooting
- Ensure proper tool permissions are set
- Check Memory keys for coordination data
- Monitor resource usage during batch operations
- Validate input parameters and constraints
- Use verbose logging for debugging