import Card from '@mui/joy/Card';
import { Typography, CardContent } from '@mui/joy';

const Listing = ({title, price} : any) => {
    <Card sx={{width: 70}}>
        <Typography level='title-lg'>{title}</Typography>
        <CardContent>w
            <Typography level="body-xs">Total price:</Typography>
            <Typography sx={{ fontSize: 'lg', fontWeight: 'lg' }}>${price}</Typography>
        </CardContent>
    </Card>
}

export default Listing;