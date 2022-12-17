import React, { useCallback, useEffect, useState } from "react";
import TableCell from "@mui/material/TableCell";
import Paper from "@mui/material/Paper";
import { useNavigate, useParams } from "react-router-dom";
import { Checkbox, MenuItem, Table, TableBody, TableContainer, TableHead, TableRow } from "@mui/material";
import Box from "@mui/material/Box";
import { useDictionaryWords } from "../../hooks/api/useDictionaryWords";
import { useWindowSizeContext } from "../../context/WindowSizeContext";
import { Loading } from "../Loading";
import { IWord } from "../../types/word";
import { useRemoveWordsToDictionary } from "../../hooks/api/useRemoveWordsToDictionary";
import { getWordEnding } from "../../helpers/getWordEnding";
import { TABLE_HEADER_HEIGHT } from "../../consts/style-variables";
import MySelect from "../Select/Select";
import { useDictionaryList } from "../../hooks/api/useDictionaryList";
import { IDictionary } from "../../types/dictionary";
import { useAddWordsToDictionary } from "../../hooks/api/useAddWordsToDictionary";
import { DeleteButton } from "../DeleteButton";

const WordsTable = () => {
	const { getDictionaryWords, loading } = useDictionaryWords()
	const { height, width } = useWindowSizeContext()
	const { getDictionaryList, loading: dictionaryListLoading } = useDictionaryList()
	const params = useParams()
	const navigate = useNavigate()
	const { dictionary: currDictionary = '' } = params
	const [rows, setRows] = useState<IWord[]>([])
	const [dictionaries, setDictionaries] = useState<IDictionary[]>([])
	const [selected, setSelected] = useState<string[]>([])
	const { deleteHandler, loading: isWordsDeleting } = useRemoveWordsToDictionary()
	const { addWordsHandler, loading: isWordsAdding } = useAddWordsToDictionary()
	const isSelected = !!selected.length

	useEffect(() => {
		if (!currDictionary) return navigate('/dictionary')
		getDictionaryWords(currDictionary).then((res: any) => setRows(res.words))
		getDictionaryList().then((res: any) => setDictionaries(res))
	}, [currDictionary, navigate, getDictionaryWords, getDictionaryList])

	const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.checked && event.target.dataset.indeterminate === 'false') {
			setSelected(rows.map((row) => row._id as string))
			return
		}
		setSelected([])
	}

	const getWordEnd = () => `Выбрано ${selected.length} ${getWordEnding(selected.length, 'слово', 'слова', 'слов')}`

	const getSelectedRows = useCallback(() => rows.filter((row) => selected.includes(row._id || '')), [selected, rows])

	const handleClick = (event: React.MouseEvent<HTMLTableRowElement, MouseEvent>, id = '') => {
		selected.includes(id) ? setSelected(selected.filter((rowId) => rowId !== id)) : setSelected([...selected, id])
	}

	const onWordsDelete = useCallback(() => {
		deleteHandler(currDictionary, getSelectedRows()).then(() => {
			getDictionaryWords(currDictionary).then((res: any) => setRows(res.words))
			setSelected([])
		})
;	}, [setSelected, getDictionaryWords, deleteHandler, currDictionary, setRows, getSelectedRows])

	const onTransferWords = useCallback(
		async (id: string) => {
			await deleteHandler(currDictionary, getSelectedRows())
			await addWordsHandler(id, getSelectedRows()).then(() => setSelected([]))
			await getDictionaryWords(currDictionary).then((res: any) => setRows(res.words))
		},
		[currDictionary, deleteHandler, getSelectedRows, setRows, addWordsHandler, getDictionaryWords]
	)

	const renderItems = () => {
		return dictionaries
			?.filter(({ _id }) => _id !== currDictionary)
			.map(({ _id: id, title }) => {
				return (
					<MenuItem disabled={dictionaryListLoading} key={id} value={id}>
						{title}
					</MenuItem>
				)
			})
	}

	if (loading) return <Loading />

	return (
		<Box sx={{ width: '100%' }}>
			<Paper sx={{ overflow: 'hidden' }}>
				{/*TODO: временное решение с height*/}
				<TableContainer sx={{ height: height - TABLE_HEADER_HEIGHT }}>
					<Table stickyHeader area-label='sticky table'>
						<TableHead>
							<TableRow>
								<TableCell padding='checkbox'>
									<Checkbox
										sx={{ padding: '0 0 0 9px' }}
										indeterminate={isSelected && selected.length < rows.length}
										checked={rows.length > 0 && selected.length === rows.length}
										onChange={handleSelectAllClick}
									/>
								</TableCell>
								<TableCell align='center'>{isSelected ? getWordEnd() : 'Перевод'}</TableCell>
								<TableCell align='center'>
									{isSelected ? (
										<MySelect
											loading={isWordsAdding || isWordsDeleting}
											renderItems={renderItems()}
											size='small'
											value="Переместить"
											onChange={onTransferWords}
										/>
									) : (
										'Слово'
									)}
								</TableCell>
								<TableCell align='center'>
									{isSelected ? (
										<DeleteButton onClick={onWordsDelete} size='small' disabled={isWordsDeleting} />
									) : width > 400 ? (
										'Транскрипция'
									) : (
										'Транс-крипция'
									)}
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.map((row: IWord) => {
								const isItemSelected = selected.includes(row._id || '')
								return (
									<TableRow
										key={row._id}
										hover
										onClick={(event) => handleClick(event, row._id)}
										role='checkbox'
										aria-checked={isItemSelected}
										selected={isItemSelected}
									>
										<TableCell padding='checkbox'>
											<Checkbox color='primary' checked={isItemSelected} />
										</TableCell>
										<TableCell align='center'>{row.russian}</TableCell>
										<TableCell align='center'>{row.english}</TableCell>
										<TableCell align='center'>{row.transcript}</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				</TableContainer>
			</Paper>
		</Box>
	)
}

export default WordsTable
