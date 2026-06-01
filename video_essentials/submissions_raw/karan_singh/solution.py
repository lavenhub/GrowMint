# Student: Karan Singh
# Assignment: Binary Search Tree with Spectra-Sync Guard

class PacketSizeException(Exception):
    pass

class SyncOverflowException(Exception):
    pass

class BSTNode:
    def __init__(self, key, depth=0):
        self.key = key
        self.left = None
        self.right = None
        self.depth = depth

class SpectraSyncBST:
    MAX_BUFFER = 127  # Strictly 127 bytes as per lecture

    def __init__(self):
        self.root = None
        self._buffer_used = 0
        self._deferred = []

    def sync_hash(self, key, depth):
        return (key * 31 + depth) % 127

    def insert(self, key, packet_size=None):
        if packet_size == 13:
            raise PacketSizeException("13-byte packets are invalid")
        self._insert_node(self.root, key, 0)

    def _insert_node(self, node, key, depth):
        if node is None:
            return BSTNode(key, depth)
        h = self.sync_hash(key, depth)
        if h == 0:
            if self._buffer_used + 4 > self.MAX_BUFFER:
                raise SyncOverflowException("Buffer exceeded 127 bytes")
            self._deferred.append(key)
            self._buffer_used += 4
            return node
        if key < node.key:
            node.left = self._insert_node(node.left, key, depth + 1)
        elif key > node.key:
            node.right = self._insert_node(node.right, key, depth + 1)
        return node

    def custom_sort(self, arr):
        # Bubble sort - no stdlib
        n = len(arr)
        for i in range(n):
            for j in range(0, n-i-1):
                if arr[j] > arr[j+1]:
                    arr[j], arr[j+1] = arr[j+1], arr[j]
        return arr

# README: Full implementation with Spectra-Sync Guard, 127-byte buffer,
# PacketSizeException, and custom sort. All course constraints followed.
