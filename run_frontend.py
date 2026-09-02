import os, subprocess

env = os.environ.copy()
node_dir = r'd:\Hackathon\Nexus\.tools\node'
env['PATH'] = node_dir + ';' + env.get('PATH', '')

npm_cmd = os.path.join(node_dir, 'npm.cmd')
subprocess.run([npm_cmd, 'run', 'dev', '--', '--host', '0.0.0.0', '--port', '5173'], cwd=r'd:\Hackathon\Nexus\frontend', env=env)
