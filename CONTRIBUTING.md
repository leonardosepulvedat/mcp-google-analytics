# Contributing to MCP Google Analytics

Thank you for your interest in contributing to the MCP Google Analytics server! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/mcp-google-analytics.git
   cd mcp-google-analytics
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Build the project**:
   ```bash
   npm run build
   ```

## 🏗️ Development Workflow

### Making Changes

1. **Create a new branch** for your feature or bugfix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the `src/` directory

3. **Build and test**:
   ```bash
   npm run build
   ```

4. **Test your changes** with Claude Desktop or Cursor by updating the config to point to your local build

### Code Style

- Use TypeScript with strict mode enabled
- Follow existing code patterns and conventions
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

### Testing Your Changes

1. Update the configuration in Claude Desktop or Cursor to use your local build:
   ```json
   {
     "mcpServers": {
       "google-analytics": {
         "command": "node",
         "args": ["/path/to/your/mcp-google-analytics/build/index.js"],
         "env": {
           "GA_SERVICE_ACCOUNT_JSON": "...",
           "GA_PROPERTY_ID": "..."
         }
       }
     }
   }
   ```

2. Test all affected tools thoroughly
3. Verify error handling works correctly
4. Check that documentation is still accurate

## 📝 Commit Guidelines

- Write clear, descriptive commit messages
- Use present tense ("Add feature" not "Added feature")
- Reference issues and pull requests when relevant

Good commit message examples:
```
Add support for GA4 custom dimensions
Fix authentication error with service accounts
Update documentation for measurement protocol
```

## 🐛 Reporting Bugs

When reporting bugs, please include:

1. **Description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details**:
   - Node.js version
   - Operating system
   - MCP client (Claude Desktop, Cursor, etc.)
5. **Error messages** or logs (redact sensitive info)

## 💡 Suggesting Enhancements

We welcome feature requests! Please:

1. **Check existing issues** first to avoid duplicates
2. **Describe the feature** clearly
3. **Explain the use case** - why is this needed?
4. **Provide examples** if possible

## 🔧 Areas for Contribution

Here are some areas where contributions are especially welcome:

### New Features
- Additional GA4 API endpoints
- Support for more event types in Measurement Protocol
- Enhanced filtering and data transformation
- Caching mechanisms for metadata
- Rate limiting and quota management

### Documentation
- More usage examples
- Tutorial videos or blog posts
- Translations to other languages
- Improved error messages

### Testing
- Unit tests
- Integration tests
- Test automation

### Performance
- Query optimization strategies
- Response caching
- Memory usage optimization

## 📄 Pull Request Process

1. **Update documentation** if needed (README, EXAMPLES, etc.)
2. **Update CHANGELOG.md** with your changes
3. **Ensure the build passes**: `npm run build`
4. **Create a pull request** with a clear description:
   - What changes were made
   - Why these changes were needed
   - How to test the changes

5. **Respond to feedback** - we may request changes or ask questions

## 🔒 Security

If you discover a security vulnerability, please **do not** open a public issue. Instead, email the maintainer directly at lsepulvedatabares@gmail.com.

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🤝 Code of Conduct

### Our Pledge

We are committed to making participation in this project a harassment-free experience for everyone.

### Our Standards

**Positive behavior includes:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community

**Unacceptable behavior includes:**
- Harassment, trolling, or insulting comments
- Personal or political attacks
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

## 💬 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **MCP Discord**: Join the Model Context Protocol community

## 🌟 Recognition

Contributors will be recognized in:
- The project README
- Release notes
- GitHub contributors page

Thank you for helping make this project better! 🎉
