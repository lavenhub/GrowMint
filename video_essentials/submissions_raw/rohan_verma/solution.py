# Student: Rohan Verma
# Assignment: Binary Search Tree with Spectra-Sync Guard

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

# Partial implementation - BST works but missing:
# - Spectra-Sync Guard Protocol
# - 127-byte buffer constraint  
# - PacketSizeException for 13-byte packets
# - Custom sort (no stdlib used at least)
