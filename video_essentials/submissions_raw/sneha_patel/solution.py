# Student: Sneha Patel
# Suspicious - very similar to Rohan Verma's submission

class BST:
    def __init__(self):
        self.root = None

    def insert(self, key):
        if self.root is None:
            self.root = {'key': key, 'left': None, 'right': None}
        else:
            self._insert(self.root, key)

    def _insert(self, node, key):
        if key < node['key']:
            if node['left'] is None:
                node['left'] = {'key': key, 'left': None, 'right': None}
            else:
                self._insert(node['left'], key)
        elif key > node['key']:
            if node['right'] is None:
                node['right'] = {'key': key, 'left': None, 'right': None}
            else:
                self._insert(node['right'], key)

    def search(self, key):
        node = self.root
        while node:
            if key == node['key']:
                return True
            elif key < node['key']:
                node = node['left']
            else:
                node = node['right']
        return False

# Missing all course-specific constraints
# Code is nearly identical to another submission
