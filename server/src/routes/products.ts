import { Router, type Request, type Response } from 'express';
import prisma from '../db.ts';

const router = Router();

// get all available products
router.get('/', async (req: Request, res: Response) => {
    const products = await prisma.product.findMany({
        where: {
            orderableItem: {
                isAvailable: true,
            },
        },
        include: {
            productType: true,
            orderableItem: true,
        },
    });
    res.json(products);
});

// get a product by id
router.get('/:id', async (req: Request, res: Response) => {
    const product = await prisma.product.findUnique({
        where: { productId: Number(req.params.id) },
        include: {
            productType: true,
            orderableItem: true,
        },
    });
    if (!product) {
        res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
});

// create a product
router.post('/', async (req: Request, res: Response) => {
const { name, basePrice, typeId } = req.body;
    const product = await prisma.orderableItem.create({
        data: {
            itemType: "product",
            product : {
                create: {
                    name,
                    basePrice,
                    typeId,
                },
            },
        },
        include: { product: true },
    });
    res.status(201).json(product);
});

// Toggle product availability
router.put('/:id/availability', async (req: Request, res: Response) => {
    const { isAvailable } = req.body;
    const item = await prisma.orderableItem.update({
        where: { itemId: Number(req.params.id) },
        data: { isAvailable },
    });
    res.json(item);
});

export default router;