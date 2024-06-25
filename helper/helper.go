package helper

func ChunkArray(array []string, chunkSize int) [][]string {
	var result [][]string

	for i := 0; i < len(array); i += chunkSize {
		end := i + chunkSize
		if end > len(array) {
			end = len(array)
		}
		result = append(result, array[i:end])
	}

	return result
}
