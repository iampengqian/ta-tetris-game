# ta-tetris-game

> Web Tetris Game


## 开发

使用 tmux-agent (ta) 进行任务管理：

```bash
# 创建新任务
ta spawn feat-xxx --agent codex --prompt-text "任务描述"

# 查看任务状态
ta task-status

# 查看任务日志
ta logs feat-xxx

# 合并 PR
ta merge feat-xxx
```

## Contributors

感谢所有贡献者！

## License

This project is licensed under the MIT License.

## Logic Tests

该项目包含基本的俄罗斯方块核心逻辑测试。

你可以通过在浏览器中打开 `test.html` 来运行测试，测试结果将直接显示在页面上。测试涵盖了：
- 面板初始化
- 碰撞检测（墙壁、方块）
- 行消除逻辑模拟
