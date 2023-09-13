### To find circular dependencies:

<!-- 📌 current circular deps.md 📝 🗑 -->
```sh
npm install --save-dev madge
node_modules/madge/bin/cli.js --warning --circular --extensions js ./
```
